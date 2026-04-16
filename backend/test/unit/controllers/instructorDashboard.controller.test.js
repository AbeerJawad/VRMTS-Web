const { expect } = require("chai");
const proxyquire = require("proxyquire").noCallThru();

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("instructor dashboard controller", () => {
  it("getClassStats rejects requests without teacherId", async () => {
    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => {
        throw new Error("db should not be called");
      },
    });

    const req = { session: { user: {} } };
    const res = createRes();
    await controller.getClassStats(req, res);
    expect(res.statusCode).to.equal(403);
    expect(res.body.message).to.equal("Teacher ID not found in session");
  });

  it("getClassStats returns aggregated stats for teacher", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("total FROM Student")) return [[{ total: 30 }]];
        if (sql.includes("AVG(qa.getScore)")) return [[{ avgScore: 78.7 }]];
        if (sql.includes("assignedModules")) return [[{ assignedModules: 12 }]];
        if (sql.includes("SELECT COUNT(*) as total FROM Module")) return [[{ total: 20 }]];
        if (sql.includes("atRiskCount")) return [[{ atRiskCount: 4 }]];
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { teacherId: 7 } } };
    const res = createRes();
    await controller.getClassStats(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.deep.equal({
      totalStudents: 30,
      averagePerformance: 79,
      modulesAssigned: 12,
      totalModules: 20,
      atRiskStudents: 4,
    });
  });

  it("assignModuleToStudent validates required fields", async () => {
    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => {
        throw new Error("db should not be called");
      },
    });

    const req = { session: { user: { teacherId: 5 } }, body: { studentId: null, moduleId: null } };
    const res = createRes();
    await controller.assignModuleToStudent(req, res);
    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal("Student ID and Module ID are required");
  });

  it("assignModuleToStudent blocks assignment to students outside teacher scope", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[]];
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { teacherId: 2 } }, body: { studentId: 11, moduleId: 22 } };
    const res = createRes();
    await controller.assignModuleToStudent(req, res);
    expect(res.statusCode).to.equal(403);
    expect(res.body.message).to.equal("You can only assign modules to your own students");
  });

  it("assignModuleToStudent assigns module for authorized student", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[{ studentId: 11 }]];
        return [[]];
      },
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { teacherId: 2 } }, body: { studentId: 11, moduleId: 22 } };
    const res = createRes();
    await controller.assignModuleToStudent(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal("Module assigned successfully");
  });

  it("unassignModuleFromStudent validates required fields", async () => {
    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => {
        throw new Error("db should not be called");
      },
    });

    const req = { session: { user: { teacherId: 5 } }, body: {} };
    const res = createRes();
    await controller.unassignModuleFromStudent(req, res);
    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal("Student ID and Module ID are required");
  });

  it("unassignModuleFromStudent returns unauthorized when student not assigned to teacher", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[]];
        return [[]];
      },
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => fakeConnection,
    });
    const req = { session: { user: { teacherId: 4 } }, body: { studentId: 55, moduleId: 66 } };
    const res = createRes();
    await controller.unassignModuleFromStudent(req, res);
    expect(res.statusCode).to.equal(403);
    expect(res.body.message).to.equal("Unauthorized");
  });

  it("getUpcomingDeadlines transforms due date data", async () => {
    const fakeConnection = {
      execute: async () => [[{
        assignment: "Respiratory",
        dueDate: "2026-05-01T00:00:00.000Z",
        studentsCompleted: 2,
        totalStudents: 10,
      }]],
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/instructorDashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { teacherId: 1 } } };
    const res = createRes();
    await controller.getUpcomingDeadlines(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data[0]).to.include({ assignment: "Respiratory", studentsCompleted: 2, totalStudents: 10 });
  });
});
