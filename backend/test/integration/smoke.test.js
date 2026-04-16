const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../../src/app");

const { expect } = chai;
chai.use(chaiHttp);

describe("integration smoke", () => {
  it("GET /api/test returns API health payload", async () => {
    const res = await chai.request(app).get("/api/test");

    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ message: "API is working!" });
  });

  it("GET /api/auth/check returns 401 without session", async () => {
    const res = await chai.request(app).get("/api/auth/check");

    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({
      isAuthenticated: false,
      message: "Not authenticated",
    });
  });
});
