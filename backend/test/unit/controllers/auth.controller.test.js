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
    clearCookie() {
      return this;
    },
  };
}

describe("auth controller", () => {
  it("returns 400 when email or password is missing", async () => {
    const login = proxyquire("../../../src/controllers/auth.controller", {
      "../config/db": async () => {
        throw new Error("db should not be called");
      },
    }).login;

    const req = { body: { email: "" }, session: {} };
    const res = createRes();

    await login(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body).to.deep.equal({
      message: "Email and password are required",
    });
  });

  it("returns 401 when user is not found", async () => {
    const fakeConnection = {
      execute: async () => [[]],
      end: async () => {},
    };

    const login = proxyquire("../../../src/controllers/auth.controller", {
      "../config/db": async () => fakeConnection,
    }).login;

    const req = {
      body: { email: "missing@example.com", password: "secret" },
      session: {},
    };
    const res = createRes();

    await login(req, res);

    expect(res.statusCode).to.equal(401);
    expect(res.body).to.deep.equal({ message: "Wrong email or password" });
  });

  it("logs in teacher and writes teacherId to session", async () => {
    const executeCalls = [];
    const fakeConnection = {
      execute: async (sql, params) => {
        executeCalls.push({ sql, params });

        if (sql.includes("SELECT * FROM User")) {
          return [[{
            userId: 9,
            email: "teacher@example.com",
            name: "Jane Teacher",
            userType: "teacher",
            passwordHash: "secret",
            isActive: 1,
          }]];
        }

        if (sql.includes("SELECT teacherId FROM teacher")) {
          return [[{ teacherId: 71 }]];
        }

        return [[]];
      },
      end: async () => {},
    };

    const login = proxyquire("../../../src/controllers/auth.controller", {
      "../config/db": async () => fakeConnection,
    }).login;

    const req = {
      body: { email: "teacher@example.com", password: "secret" },
      session: {
        save(cb) {
          cb(null);
        },
      },
    };
    const res = createRes();

    await login(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal("Login successful");
    expect(req.session.user).to.deep.equal({
      userId: 9,
      email: "teacher@example.com",
      name: "Jane Teacher",
      userType: "teacher",
      teacherId: 71,
    });
    expect(executeCalls.some((call) => call.sql.includes("UPDATE User SET lastLogin"))).to.equal(true);
  });

  it("returns 500 when session save fails after valid credentials", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT * FROM User")) {
          return [[{
            userId: 11,
            email: "student@example.com",
            name: "Sam Student",
            userType: "student",
            passwordHash: "pw",
            isActive: 1,
          }]];
        }
        if (sql.includes("SELECT studentId FROM student")) {
          return [[{ studentId: 22 }]];
        }
        return [[]];
      },
      end: async () => {},
    };

    const login = proxyquire("../../../src/controllers/auth.controller", {
      "../config/db": async () => fakeConnection,
    }).login;

    const req = {
      body: { email: "student@example.com", password: "pw" },
      session: {
        save(cb) {
          cb(new Error("session store down"));
        },
      },
    };
    const res = createRes();

    await login(req, res);

    expect(res.statusCode).to.equal(500);
    expect(res.body.message).to.equal("Session creation failed");
    expect(res.body.error).to.equal("session store down");
  });

  it("checkAuth returns 401 when request has no authenticated session", async () => {
    const checkAuth = require("../../../src/controllers/auth.controller").checkAuth;
    const req = { session: {} };
    const res = createRes();

    await checkAuth(req, res);

    expect(res.statusCode).to.equal(401);
    expect(res.body).to.deep.equal({
      isAuthenticated: false,
      message: "Not authenticated",
    });
  });
});
