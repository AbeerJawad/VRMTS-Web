const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Integration Tests - Complete User Flow', () => {
  let app;
  let agent;

  before(() => {
    app = require('../src/server');
    agent = chai.request.agent(app);
  });

  after(() => {
    agent.close();
  });

  it('should complete full quiz workflow', (done) => {
    // Step 1: Login
    agent
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123'
      })
      .end((err, loginRes) => {
        expect(loginRes).to.have.status(200);
        
        // Step 2: Get modules
        agent
          .get('/api/modules')
          .end((err, modulesRes) => {
            expect(modulesRes).to.have.status(200);
            
            // Step 3: Start quiz
            agent
              .post('/api/quiz/module/1/start')
              .end((err, startRes) => {
                expect(startRes).to.have.status(200);
                const attemptId = startRes.body.data.attemptId;
                
                // Step 4: Get quiz questions
                agent
                  .get(`/api/quiz/attempt/${attemptId}`)
                  .end((err, getRes) => {
                    expect(getRes).to.have.status(200);
                    
                    // Step 5: Submit answers
                    const questions = getRes.body.data.questions;
                    const firstQuestion = questions[0];
                    
                    agent
                      .post(`/api/quiz/attempt/${attemptId}/answer`)
                      .send({
                        questionId: firstQuestion.id,
                        answer: firstQuestion.correctAnswer,
                        timeSpent: 30
                      })
                      .end((err, answerRes) => {
                        expect(answerRes).to.have.status(200);
                        
                        // Step 6: Check progress
                        agent
                          .get(`/api/quiz/attempt/${attemptId}/progress`)
                          .end((err, progressRes) => {
                            expect(progressRes).to.have.status(200);
                            
                            // Step 7: Check dashboard updates
                            agent
                              .get('/api/dashboard/stats')
                              .end((err, dashRes) => {
                                expect(dashRes).to.have.status(200);
                                done();
                              });
                          });
                      });
                  });
              });
          });
      });
  });
});