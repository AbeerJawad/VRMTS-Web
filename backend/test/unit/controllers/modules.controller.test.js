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

describe("modules controller", () => {
  it("returns transformed module list for teacher/admin access", async () => {
    const fakeModules = [
      {
        moduleId: 5,
        name: "Cardio Basics",
        description: "Heart and circulation",
        difficulty: "easy",
        progress: 0,
        status: "not_started",
        hoursSpent: null,
      },
    ];

    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("FROM Module")) {
          return [fakeModules];
        }
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/modules.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 1, userType: "teacher" } } };
    const res = createRes();

    await controller.getModules(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.length(1);
    expect(res.body.data[0]).to.include({
      moduleId: 5,
      name: "Cardio Basics",
      category: "cardiovascular",
      icon: "🫀",
      status: "not_started",
      progress: 0,
      hoursSpent: 0,
    });
    expect(res.body.data[0].duration).to.equal("3-4 hours");
    expect(res.body.data[0].completedParts).to.equal(0);
  });

  it("returns 403 for student when no student record exists", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) {
          return [[]];
        }
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/modules.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 77, userType: "student" } } };
    const res = createRes();

    await controller.getModules(req, res);

    expect(res.statusCode).to.equal(403);
    expect(res.body).to.deep.equal({
      success: false,
      message: "User is not a student",
    });
  });

  it("returns rounded module stats for valid student", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) {
          return [[{ studentId: 13 }]];
        }
        if (sql.includes("FROM StudentModuleAssignment")) {
          return [[{
            total: 6,
            completed: 2,
            inProgress: 3,
            avgProgress: 66.6,
          }]];
        }
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/modules.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 88 } } };
    const res = createRes();

    await controller.getModulesStats(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({
      success: true,
      data: {
        total: 6,
        completed: 2,
        inProgress: 3,
        avgProgress: 67,
      },
    });
  });
});
