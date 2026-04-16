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

describe("user controller", () => {
  it("updatePreferences returns 401 when user is not authenticated", async () => {
    const controller = proxyquire("../../../src/controllers/user.controller", {
      "../config/db": async () => {
        throw new Error("should not reach db");
      },
    });

    const req = { session: { user: {} }, body: {} };
    const res = createRes();

    await controller.updatePreferences(req, res);
    expect(res.statusCode).to.equal(401);
    expect(res.body).to.deep.equal({ message: "Not authenticated" });
  });

  it("updatePreferences writes settings and returns success", async () => {
    const calls = [];
    const fakeConnection = {
      execute: async (sql, params) => {
        calls.push({ sql, params });
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/user.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = {
      session: { user: { userId: 123 } },
      body: {
        theme: "dark",
        language: "en",
        timeZone: "Asia/Manila",
        dateFormat: "MM/DD/YYYY",
        defaultView: "dashboard",
      },
    };
    const res = createRes();

    await controller.updatePreferences(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({ message: "Preferences updated successfully" });
    expect(calls[0].params[0]).to.equal(123);
  });

  it("changePassword returns 404 when user record does not exist", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT passwordHash FROM User")) return [[]];
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/user.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = {
      session: { user: { userId: 5 } },
      body: { currentPassword: "old", newPassword: "new" },
    };
    const res = createRes();

    await controller.changePassword(req, res);
    expect(res.statusCode).to.equal(404);
    expect(res.body).to.deep.equal({ message: "User not found" });
  });

  it("changePassword updates password for valid user", async () => {
    const calls = [];
    const fakeConnection = {
      execute: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes("SELECT passwordHash FROM User")) return [[{ passwordHash: "oldhash" }]];
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/user.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = {
      session: { user: { userId: 5 } },
      body: { currentPassword: "old", newPassword: "newpass" },
    };
    const res = createRes();

    await controller.changePassword(req, res);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.deep.equal({ message: "Password changed successfully" });
    expect(calls.some((c) => c.sql.includes("UPDATE User SET passwordHash"))).to.equal(true);
  });

  it("getUserSettings returns structured settings payload", async () => {
    const fakeConnection = {
      execute: async (sql) => {
        if (sql.includes("SELECT name, email FROM User")) return [[{ name: "Jane Doe", email: "jane@example.com" }]];
        if (sql.includes("SELECT * FROM UserPreferences")) {
          return [[{ phone: "123", institution: "VRMTS", bio: "student", theme: "dark" }]];
        }
        if (sql.includes("SELECT * FROM UserAccessibility")) return [[{ textSize: "large", captions: 1 }]];
        if (sql.includes("SELECT * FROM UserNotifications")) return [[{ assignments: 1, announcements: 1 }]];
        return [[]];
      },
      end: async () => {},
    };

    const controller = proxyquire("../../../src/controllers/user.controller", {
      "../config/db": async () => fakeConnection,
    });

    const req = { session: { user: { userId: 99 } } };
    const res = createRes();

    await controller.getUserSettings(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.account).to.deep.include({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "123",
    });
    expect(res.body.preferences.theme).to.equal("dark");
    expect(res.body.accessibility.textSize).to.equal("large");
  });
});
