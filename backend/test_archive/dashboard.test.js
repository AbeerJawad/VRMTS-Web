const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Dashboard Tests', () => {
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

  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard stats', (done) => {
      agent
        .get('/api/dashboard/stats')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('modulesCompleted');
          expect(res.body.data).to.have.property('totalModules');
          expect(res.body.data).to.have.property('averageScore');
          expect(res.body.data).to.have.property('studyStreak');
          done();
        });
    });
  });

  describe('GET /api/dashboard/recent-modules', () => {
    it('should get recent modules', (done) => {
      agent
        .get('/api/dashboard/recent-modules')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/dashboard/recent-activity', () => {
    it('should get recent activity', (done) => {
      agent
        .get('/api/dashboard/recent-activity')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });
});