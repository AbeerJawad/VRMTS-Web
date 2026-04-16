const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Quiz Tests', () => {
  let app;
  let agent;
  let attemptId;
  let quizId;

  before((done) => {
    app = require('../src/server');
    agent = chai.request.agent(app);
    
    // Login first
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

  describe('GET /api/quiz/modules', () => {
    it('should get available quiz modules', (done) => {
      agent
        .get('/api/quiz/modules')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.be.an('array');
          done();
        });
    });

    it('should reject unauthorized access', (done) => {
      chai.request(app)
        .get('/api/quiz/modules')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe('GET /api/quiz/stats', () => {
    it('should get quiz statistics', (done) => {
      agent
        .get('/api/quiz/stats')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('quizzesTaken');
          expect(res.body.data).to.have.property('averageScore');
          expect(res.body.data).to.have.property('passRate');
          done();
        });
    });
  });

  describe('POST /api/quiz/module/:moduleId/start', () => {
    it('should start a module quiz', (done) => {
      agent
        .post('/api/quiz/module/1/start')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('attemptId');
          expect(res.body.data).to.have.property('quizId');
          expect(res.body.data).to.have.property('timeLimit');
          expect(res.body.data).to.have.property('totalQuestions');
          
          attemptId = res.body.data.attemptId;
          quizId = res.body.data.quizId;
          done();
        });
    });

    it('should reject invalid module ID', (done) => {
      agent
        .post('/api/quiz/module/9999/start')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it('should reject non-numeric module ID', (done) => {
      agent
        .post('/api/quiz/module/invalid/start')
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe('GET /api/quiz/attempt/:attemptId', () => {
    it('should get quiz attempt details', (done) => {
      agent
        .post('/api/quiz/module/1/start')
        .end((err, res) => {
          const attemptId = res.body.data.attemptId;
          
          agent
            .get(`/api/quiz/attempt/${attemptId}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('success', true);
              expect(res.body.data).to.have.property('attemptId');
              expect(res.body.data).to.have.property('questions');
              expect(res.body.data.questions).to.be.an('array');
              done();
            });
        });
    });
  });

  describe('POST /api/quiz/attempt/:attemptId/answer', () => {
    it('should submit an answer', (done) => {
      agent
        .post('/api/quiz/module/1/start')
        .end((err, startRes) => {
          const attemptId = startRes.body.data.attemptId;
          
          agent
            .get(`/api/quiz/attempt/${attemptId}`)
            .end((err, getRes) => {
              const firstQuestion = getRes.body.data.questions[0];
              
              agent
                .post(`/api/quiz/attempt/${attemptId}/answer`)
                .send({
                  questionId: firstQuestion.id,
                  answer: firstQuestion.correctAnswer,
                  timeSpent: 30
                })
                .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.have.property('success', true);
                  expect(res.body.data).to.have.property('isCorrect');
                  expect(res.body.data).to.have.property('pointsEarned');
                  done();
                });
            });
        });
    });

    it('should reject answer for non-existent question', (done) => {
      agent
        .post('/api/quiz/module/1/start')
        .end((err, startRes) => {
          const attemptId = startRes.body.data.attemptId;
          
          agent
            .post(`/api/quiz/attempt/${attemptId}/answer`)
            .send({
              questionId: 99999,
              answer: 'A',
              timeSpent: 30
            })
            .end((err, res) => {
              expect(res).to.have.status(404);
              done();
            });
        });
    });
  });

  describe('GET /api/quiz/attempt/:attemptId/progress', () => {
    it('should get quiz progress', (done) => {
      agent
        .post('/api/quiz/module/1/start')
        .end((err, res) => {
          const attemptId = res.body.data.attemptId;
          
          agent
            .get(`/api/quiz/attempt/${attemptId}/progress`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('success', true);
              expect(res.body.data).to.have.property('answeredQuestions');
              expect(res.body.data).to.have.property('totalQuestions');
              expect(res.body.data).to.have.property('progressPercentage');
              done();
            });
        });
    });
  });

  describe('POST /api/quiz/attempt/:attemptId/finish', () => {
    it('should finish a quiz successfully', (done) => {
      agent
        .post('/api/quiz/module/1/start')
        .end((err, startRes) => {
          const attemptId = startRes.body.data.attemptId;
          
          // Answer all questions first
          agent
            .get(`/api/quiz/attempt/${attemptId}`)
            .end((err, getRes) => {
              const questions = getRes.body.data.questions;
              
              // Submit answers for all questions
              let answersSubmitted = 0;
              questions.forEach((q, idx) => {
                agent
                  .post(`/api/quiz/attempt/${attemptId}/answer`)
                  .send({
                    questionId: q.id,
                    answer: q.correctAnswer,
                    timeSpent: 30
                  })
                  .end(() => {
                    answersSubmitted++;
                    
                    if (answersSubmitted === questions.length) {
                      // Now finish the quiz
                      agent
                        .post(`/api/quiz/attempt/${attemptId}/finish`)
                        .end((err, res) => {
                          expect(res).to.have.status(200);
                          expect(res.body).to.have.property('success', true);
                          expect(res.body.data).to.have.property('score');
                          expect(res.body.data).to.have.property('passed');
                          expect(res.body.data).to.have.property('correctAnswers');
                          done();
                        });
                    }
                  });
              });
            });
        });
    });
  });

  describe('GET /api/quiz/attempts', () => {
    it('should get previous quiz attempts', (done) => {
      agent
        .get('/api/quiz/attempts')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.be.an('array');
          done();
        });
    });
  });

  describe('POST /api/quiz/timed-exam/start', () => {
    it('should start a timed exam', (done) => {
      agent
        .post('/api/quiz/timed-exam/start')
        .send({
          timeLimit: 30,
          questionCount: 20,
          selectedModules: [1, 2]
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('attemptId');
          expect(res.body.data.timeLimit).to.equal(30);
          done();
        });
    });

    it('should validate question count', (done) => {
      agent
        .post('/api/quiz/timed-exam/start')
        .send({
          timeLimit: 30,
          questionCount: -5,
          selectedModules: [1]
        })
        .end((err, res) => {
          // Should handle invalid count gracefully
          expect(res).to.have.status([200, 400]);
          done();
        });
    });
  });

  describe('POST /api/quiz/adaptive/start', () => {
    it('should start an adaptive test', (done) => {
      agent
        .post('/api/quiz/adaptive/start')
        .send({
          targetDifficulty: 'medium',
          questionCount: 18
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.data).to.have.property('attemptId');
          done();
        });
    });
  });
});