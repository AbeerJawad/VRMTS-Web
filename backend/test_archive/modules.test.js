const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Modules Tests', () => {
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

  describe('GET /api/modules', () => {
    it('should get all modules for student', (done) => {
      agent
        .get('/api/modules')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.be.an('array');
          
          if (res.body.data.length > 0) {
            const module = res.body.data[0];
            expect(module).to.have.property('moduleId');
            expect(module).to.have.property('name');
            expect(module).to.have.property('description');
            expect(module).to.have.property('difficulty');
          }
          done();
        });
    });

    it('should reject unauthorized access', (done) => {
      chai.request(app)
        .get('/api/modules')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe('GET /api/modules/stats', () => {
    it('should get module statistics', (done) => {
      agent
        .get('/api/modules/stats')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('total');
          expect(res.body.data).to.have.property('completed');
          expect(res.body.data).to.have.property('inProgress');
          done();
        });
    });
  });

  describe('POST /api/modules/:moduleId/start', () => {
    it('should start a module', (done) => {
      agent
        .post('/api/modules/1/start')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message', 'Module started successfully');
          done();
        });
    });
  });
});