const chai = require('chai');
const expect = chai.expect;

class AssertionHelper {
  static assertSuccessResponse(res, expectedStatus = 200) {
    expect(res).to.have.status(expectedStatus);
    expect(res.body).to.have.property('success', true);
  }

  static assertErrorResponse(res, expectedStatus = 400) {
    expect(res).to.have.status(expectedStatus);
    expect(res.body).to.have.property('success', false);
    expect(res.body).to.have.property('message');
  }

  static assertUser(user) {
    expect(user).to.have.property('userId');
    expect(user).to.have.property('email');
    expect(user).to.have.property('name');
    expect(user).to.have.property('userType');
  }

  static assertModule(module) {
    expect(module).to.have.property('moduleId');
    expect(module).to.have.property('name');
    expect(module).to.have.property('description');
    expect(module).to.have.property('difficulty');
  }

  static assertQuizAttempt(attempt) {
    expect(attempt).to.have.property('attemptId');
    expect(attempt).to.have.property('quizId');
    expect(attempt).to.have.property('status');
  }

  static assertQuizResults(results) {
    expect(results).to.have.property('score');
    expect(results).to.have.property('passed');
    expect(results).to.have.property('correctAnswers');
    expect(results).to.have.property('incorrectAnswers');
    expect(results.score).to.be.a('number');
    expect(results.score).to.be.at.least(0);
    expect(results.score).to.be.at.most(100);
  }

  static assertDashboardStats(stats) {
    expect(stats).to.have.property('modulesCompleted');
    expect(stats).to.have.property('totalModules');
    expect(stats).to.have.property('averageScore');
    expect(stats).to.have.property('studyStreak');
  }
}

module.exports = AssertionHelper;