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

describe("admin controller", () => {
  it("getStudents returns student list", async () => {
    const fakeConnection = {
      execute: async () => [[{ studentId: 1, name: "Student A" }]],
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });

    const res = createRes();
    await controller.getStudents({}, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.length(1);
  });

  it("createFacultyAccount creates user and teacher records", async () => {
    const calls = [];
    const fakeConnection = {
      beginTransaction: async () => {},
      execute: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes("INSERT INTO user")) return [{ insertId: 10 }];
        if (sql.includes("INSERT INTO teacher")) return [{ insertId: 20 }];
        return [[]];
      },
      commit: async () => {},
      rollback: async () => {},
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = {
      session: { user: { userId: 999 } },
      body: { name: "Prof X", email: "x@uni.com", department: "Bio", password: "pw" },
    };
    const res = createRes();

    await controller.createFacultyAccount(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({ success: true, message: "Faculty account created" });
    expect(calls.some((c) => c.sql.includes("CREATE_FACULTY") || c.sql.includes("audit_logs"))).to.equal(true);
  });

  it("createFacultyAccount rolls back on failure", async () => {
    let rollbackCalled = false;
    const fakeConnection = {
      beginTransaction: async () => {},
      execute: async (sql) => {
        if (sql.includes("INSERT INTO user")) {
          throw new Error("duplicate email");
        }
        return [[]];
      },
      commit: async () => {},
      rollback: async () => {
        rollbackCalled = true;
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = {
      session: { user: { userId: 999 } },
      body: { name: "Prof X", email: "x@uni.com", department: "Bio", password: "pw" },
    };
    const res = createRes();

    await controller.createFacultyAccount(req, res);
    expect(rollbackCalled).to.equal(true);
    expect(res.statusCode).to.equal(500);
    expect(res.body.success).to.equal(false);
  });

  it("updateStudentStatus toggles user state", async () => {
    const fakeConnection = {
      execute: async () => [[]],
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 1 } }, body: { userId: 12, isActive: false } };
    const res = createRes();
    await controller.updateStudentStatus(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal("Status updated");
  });

  it("assignTeacherToStudent returns success", async () => {
    const fakeConnection = {
      execute: async () => [[]],
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 1 } }, body: { studentId: 2, teacherId: 3, className: "A" } };
    const res = createRes();
    await controller.assignTeacherToStudent(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal("Teacher assigned");
  });

  it("sendGlobalAnnouncement inserts notifications for active users", async () => {
    const insertCalls = [];
    const fakeConnection = {
      execute: async (sql, params) => {
        if (sql.includes("SELECT userId FROM user")) return [[{ userId: 5 }, { userId: 6 }]];
        if (sql.includes("INSERT INTO notification")) insertCalls.push(params);
        return [[]];
      },
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = {
      session: { user: { userId: 1 } },
      body: { title: "Notice", message: "Hi all", type: "info" },
    };
    const res = createRes();
    await controller.sendGlobalAnnouncement(req, res);
    expect(res.statusCode).to.equal(200);
    expect(insertCalls).to.have.length(2);
  });

  it("getTeachers returns list of active teachers", async () => {
    const fakeConnection = {
      execute: async () => [[{ teacherId: 1, name: "Teach" }]],
      end: async () => {},
    };
    const controller = proxyquire("../../../src/controllers/admin.controller", {
      "../config/db": async () => fakeConnection,
    });
    const res = createRes();
    await controller.getTeachers({}, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
  });
});
