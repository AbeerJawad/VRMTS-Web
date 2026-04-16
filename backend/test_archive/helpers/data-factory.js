class DataFactory {
  static createUser(overrides = {}) {
    return {
      email: `test${Date.now()}@test.com`,
      password: 'test123',
      name: 'Test User',
      userType: 'student',
      isActive: true,
      ...overrides
    };
  }

  static createModule(overrides = {}) {
    return {
      title: `Test Module ${Date.now()}`,
      description: 'Test module description',
      difficultyLevel: 'medium',
      ...overrides
    };
  }

  static createQuiz(moduleId, overrides = {}) {
    return {
      moduleId,
      timeLimit: 30,
      totalQuestions: 10,
      passingScore: 60,
      ...overrides
    };
  }

  static createQuestion(overrides = {}) {
    return {
      questionType: 'multiple_choice',
      difficulty: 'medium',
      topic: 'Test Topic',
      options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
      correctAnswer: 'Option A',
      explanation: 'Test explanation',
      ...overrides
    };
  }

  static createQuizAttempt(studentId, quizId, overrides = {}) {
    return {
      studentId,
      quizId,
      startTime: new Date(),
      status: 'in_progress',
      ...overrides
    };
  }
}

module.exports = DataFactory;