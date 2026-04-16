// test/setup.js - Test setup and configuration
const chai = require('chai');
const chaiHttp = require('chai-http');
const mysql = require('mysql2/promise');
require('dotenv').config();

chai.use(chaiHttp);
global.expect = chai.expect;
global.should = chai.should();

// Test database connection
let testConnection;

const getTestConnection = async () => {
  if (!testConnection) {
    testConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
  }
  return testConnection;
};

// Cleanup function
const cleanupTestData = async () => {
  const conn = await getTestConnection();
  // Add cleanup queries if needed
  await conn.execute('DELETE FROM QuizAttempt WHERE studentId IN (SELECT studentId FROM Student WHERE userId IN (SELECT userId FROM User WHERE email LIKE "test%@test.com"))');
};

module.exports = {
  getTestConnection,
  cleanupTestData
};
