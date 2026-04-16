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

describe("dashboard controller", () => {
  it("getDashboardStats returns 404 when student profile is missing", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[]];
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/dashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 10 } } };
    const res = createRes();
    await controller.getDashboardStats(req, res);

    expect(res.statusCode).to.equal(404);
    expect(res.body).to.deep.equal({
      success: false,
      message: "Student profile not found",
    });
  });

  it("getDashboardStats returns computed stats for student", async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[{ studentId: 42 }]];
        if (sql.includes("FROM StudentModuleAssignment")) return [[{ total: 8, completed: 3, totalHours: 12.7 }]];
        if (sql.includes("FROM QuizAttempt qa")) return [[{ avgScore: 74.8 }]];
        if (sql.includes("FROM LearningSession")) {
          return [[{ date: today }, { date: yesterday }, { date: fiveDaysAgo }]];
        }
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/dashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 10 } } };
    const res = createRes();
    await controller.getDashboardStats(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.deep.equal({
      modulesCompleted: 3,
      totalModules: 8,
      averageScore: 75,
      studyStreak: 2,
      totalHours: 13,
    });
  });

  it("getRecentActivity merges quiz and study activity", async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[{ studentId: 101 }]];
        if (sql.includes("FROM QuizAttempt qa")) {
          return [[{
            action: "Completed quiz",
            module: "Cardio",
            score: 88,
            time: oneHourAgo,
            type: "quiz",
          }]];
        }
        if (sql.includes("FROM LearningSession ls")) {
          return [[{
            action: "Studied module",
            module: "Nervous System",
            score: null,
            time: twoHoursAgo,
            type: "study",
          }]];
        }
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/dashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 15 } } };
    const res = createRes();
    await controller.getRecentActivity(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.length(2);
    expect(res.body.data[0]).to.include({ action: "Completed quiz", module: "Cardio", score: 88 });
  });

  it("getUpcomingDeadlines returns transformed deadlines", async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 4);

    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT studentId FROM Student")) return [[{ studentId: 50 }]];
        if (sql.includes("FROM Quiz q")) {
          return [[{ quizId: 9, moduleTitle: "Bones", type: "Quiz", dueDate }]];
        }
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/dashboard.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 9 } } };
    const res = createRes();
    await controller.getUpcomingDeadlines(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data[0].title).to.equal("Quiz: Bones");
    expect(res.body.data[0].daysUntil).to.be.a("number");
  });
});
