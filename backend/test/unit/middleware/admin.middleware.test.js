const { expect } = require("chai");
const adminMiddleware = require("../../../src/middleware/admin.middleware");

describe("admin middleware", () => {
  it("calls next when user is admin", () => {
    const req = { session: { user: { userType: "admin" } } };
    const res = {
      statusCalled: false,
      status() {
        this.statusCalled = true;
        return this;
      },
      json() {
        return this;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    adminMiddleware(req, res, next);

    expect(nextCalled).to.equal(true);
    expect(res.statusCalled).to.equal(false);
  });

  it("returns 403 when user is not admin", () => {
    const req = { session: { user: { userType: "student" } } };
    const payload = {};
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        payload.body = body;
        return this;
      },
    };
    const next = () => {};

    adminMiddleware(req, res, next);

    expect(res.statusCode).to.equal(403);
    expect(payload.body).to.deep.equal({
      success: false,
      message: "Access denied: Admin privileges required",
    });
  });
});
