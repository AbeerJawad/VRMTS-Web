const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('User Settings Tests', () => {
  let app;
  let agent;

  before((done) => {
    app = require('../src/server');
    agent = chai.request.agent(app);
    
    agent
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123'
      })
      .end(() => {
        done();
      });
  });

  after(() => {
    agent.close();
  });

  describe('GET /api/user/settings', () => {
    it('should get user settings', (done) => {
      agent
        .get('/api/user/settings')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('account');
          expect(res.body).to.have.property('preferences');
          done();
        });
    });
  });

  describe('PUT /api/user/account', () => {
    it('should update account info', (done) => {
      agent
        .put('/api/user/account')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'student@test.com',
          phone: '1234567890'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('PUT /api/user/preferences', () => {
    it('should update preferences', (done) => {
      agent
        .put('/api/user/preferences')
        .send({
          theme: 'dark',
          language: 'en',
          timeZone: 'UTC'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });
});