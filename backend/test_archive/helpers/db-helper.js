const mysql = require('mysql2/promise');
require('dotenv').config();

class DBHelper {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
      });
    }
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  // Create test user
  async createTestUser(email = 'test@test.com', password = 'test123', userType = 'student') {
    const conn = await this.connect();
    const [result] = await conn.execute(
      'INSERT INTO User (email, passwordHash, name, userType, isActive) VALUES (?, ?, ?, ?, TRUE)',
      [email, password, 'Test User', userType]
    );
    return result.insertId;
  }

  // Create test student
  async createTestStudent(userId, enrollmentNumber = 'TEST001') {
    const conn = await this.connect();
    const [result] = await conn.execute(
      'INSERT INTO Student (userId, enrollmentNumber, currentSemester) VALUES (?, ?, 1)',
      [userId, enrollmentNumber]
    );
    return result.insertId;
  }

  // Create test module
  async createTestModule(title = 'Test Module', difficulty = 'medium') {
    const conn = await this.connect();
    const [result] = await conn.execute(
      'INSERT INTO Module (title, description, difficultyLevel) VALUES (?, ?, ?)',
      [title, 'Test module description', difficulty]
    );
    return result.insertId;
  }

  // Create test quiz
  async createTestQuiz(moduleId, timeLimit = 30, totalQuestions = 10) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      'INSERT INTO Quiz (moduleId, timeLimit, totalQuestions, passingScore) VALUES (?, ?, ?, 60)',
      [moduleId, timeLimit, totalQuestions]
    );
    return result.insertId;
  }

  // Create test questions
  async createTestQuestions(quizId, count = 5) {
    const conn = await this.connect();
    const questionIds = [];

    for (let i = 0; i < count; i++) {
      // First create in QuestionBank
      const [bankResult] = await conn.execute(
        'INSERT INTO QuestionBank (questionType, difficulty, topic, options, correctAnswer) VALUES (?, ?, ?, ?, ?)',
        ['multiple_choice', 'medium', `Test Topic ${i}`, JSON.stringify(['A', 'B', 'C', 'D']), 'A']
      );

      // Then create in QuizQuestion
      const [questionResult] = await conn.execute(
        'INSERT INTO QuizQuestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, 1, ?)',
        [quizId, bankResult.insertId, `Test Question ${i + 1}`, 'medium', i + 1]
      );

      questionIds.push(questionResult.insertId);
    }

    return questionIds;
  }

  // Create module assignment
  async assignModule(studentId, moduleId) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      'INSERT INTO StudentModuleAssignment (studentId, moduleId, status, assignedAt) VALUES (?, ?, "not_started", NOW())',
      [studentId, moduleId]
    );
    return result.insertId;
  }

  // Clean up test data
  async cleanupTestData() {
    const conn = await this.connect();
    
    try {
      // Delete in correct order to maintain referential integrity
      await conn.execute('DELETE FROM AnswerRecord WHERE attemptId IN (SELECT attemptId FROM QuizAttempt WHERE studentId IN (SELECT studentId FROM Student WHERE userId IN (SELECT userId FROM User WHERE email LIKE "test%@test.com")))');
      await conn.execute('DELETE FROM QuizAttempt WHERE studentId IN (SELECT studentId FROM Student WHERE userId IN (SELECT userId FROM User WHERE email LIKE "test%@test.com"))');
      await conn.execute('DELETE FROM QuizQuestion WHERE quizId IN (SELECT quizId FROM Quiz WHERE moduleId IN (SELECT moduleId FROM Module WHERE title LIKE "Test%"))');
      await conn.execute('DELETE FROM Quiz WHERE moduleId IN (SELECT moduleId FROM Module WHERE title LIKE "Test%")');
      await conn.execute('DELETE FROM StudentModuleAssignment WHERE studentId IN (SELECT studentId FROM Student WHERE userId IN (SELECT userId FROM User WHERE email LIKE "test%@test.com"))');
      await conn.execute('DELETE FROM Student WHERE userId IN (SELECT userId FROM User WHERE email LIKE "test%@test.com")');
      await conn.execute('DELETE FROM Module WHERE title LIKE "Test%"');
      await conn.execute('DELETE FROM User WHERE email LIKE "test%@test.com"');
      await conn.execute('DELETE FROM QuestionBank WHERE topic LIKE "Test%"');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  }

  // Get test user by email
  async getTestUser(email) {
    const conn = await this.connect();
    const [rows] = await conn.execute('SELECT * FROM User WHERE email = ?', [email]);
    return rows[0];
  }

  // Get student by userId
  async getStudent(userId) {
    const conn = await this.connect();
    const [rows] = await conn.execute('SELECT * FROM Student WHERE userId = ?', [userId]);
    return rows[0];
  }
}

module.exports = new DBHelper();
