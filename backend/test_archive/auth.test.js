const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Authentication Tests', () => {
  let app;
  let agent;

  before(() => {
    // Start your server
    app = require('../src/server');
    agent = chai.request.agent(app);
  });

  after(() => {
    agent.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Login successful');
          expect(res.body).to.have.property('user');
          expect(res.body.user).to.have.property('userId');
          expect(res.body.user).to.have.property('email', 'student@test.com');
          done();
        });
    });

    it('should reject login with invalid email', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message', 'Wrong email or password');
          done();
        });
    });

    it('should reject login with wrong password', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'wrongpassword'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message', 'Wrong email or password');
          done();
        });
    });

    it('should reject login with missing credentials', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'student@test.com'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message', 'Email and password are required');
          done();
        });
    });

    it('should reject login for inactive account', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('message', 'Account is not active');
          done();
        });
    });
  });

  describe('GET /api/auth/check', () => {
    it('should return authenticated status for logged in user', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        })
        .end(() => {
          agent
            .get('/api/auth/check')
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('isAuthenticated', true);
              expect(res.body).to.have.property('user');
              done();
            });
        });
    });

    it('should return unauthenticated for non-logged in user', (done) => {
      const newAgent = chai.request.agent(app);
      newAgent
        .get('/api/auth/check')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('isAuthenticated', false);
          newAgent.close();
          done();
        });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        })
        .end(() => {
          agent
            .post('/api/auth/logout')
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('message', 'Logout successful');
              done();
            });
        });
    });

    it('should clear session after logout', (done) => {
      agent
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        })
        .end(() => {
          agent
            .post('/api/auth/logout')
            .end(() => {
              agent
                .get('/api/auth/check')
                .end((err, res) => {
                  expect(res).to.have.status(401);
                  expect(res.body).to.have.property('isAuthenticated', false);
                  done();
                });
            });
        });
    });
  });
});