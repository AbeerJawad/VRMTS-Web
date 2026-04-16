class QuizHelper {
  constructor(agent) {
    this.agent = agent;
  }

  async startModuleQuiz(moduleId) {
    return await this.agent.post(`/api/quiz/module/${moduleId}/start`);
  }

  async getQuizAttempt(attemptId) {
    return await this.agent.get(`/api/quiz/attempt/${attemptId}`);
  }

  async submitAnswer(attemptId, questionId, answer, timeSpent = 30) {
    return await this.agent
      .post(`/api/quiz/attempt/${attemptId}/answer`)
      .send({ questionId, answer, timeSpent });
  }

  async submitAllAnswers(attemptId, questions, correctOnly = true) {
    const results = [];
    
    for (const question of questions) {
      const answer = correctOnly ? question.correctAnswer : 'Wrong Answer';
      const res = await this.submitAnswer(attemptId, question.id, answer);
      results.push(res);
    }
    
    return results;
  }

  async finishQuiz(attemptId) {
    return await this.agent.post(`/api/quiz/attempt/${attemptId}/finish`);
  }

  async getProgress(attemptId) {
    return await this.agent.get(`/api/quiz/attempt/${attemptId}/progress`);
  }

  async completeQuiz(moduleId, correctAnswerPercent = 100) {
    // Start quiz
    const startRes = await this.startModuleQuiz(moduleId);
    const attemptId = startRes.body.data.attemptId;
    
    // Get questions
    const getRes = await this.getQuizAttempt(attemptId);
    const questions = getRes.body.data.questions;
    
    // Submit answers
    const correctCount = Math.floor(questions.length * (correctAnswerPercent / 100));
    
    for (let i = 0; i < questions.length; i++) {
      const answer = i < correctCount ? questions[i].correctAnswer : 'Wrong Answer';
      await this.submitAnswer(attemptId, questions[i].id, answer);
    }
    
    // Finish quiz
    return await this.finishQuiz(attemptId);
  }
}

module.exports = QuizHelper;
