const { expect } = require("chai");
const authMiddleware = require("../../../src/middleware/auth.middleware");

describe("auth middleware", () => {
  it("calls next when session user exists", () => {
    const req = { session: { user: { id: 1 } } };
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

    authMiddleware(req, res, next);

    expect(nextCalled).to.equal(true);
    expect(res.statusCalled).to.equal(false);
  });

  it("returns 401 when session is missing", () => {
    const req = {};
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

    authMiddleware(req, res, next);

    expect(res.statusCode).to.equal(401);
    expect(payload.body).to.deep.equal({
      success: false,
      message: "Authentication required",
    });
  });
});
