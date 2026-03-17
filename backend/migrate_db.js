const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Connected to database.');

    // Add columns to student table
    console.log('Checking student table columns...');
    const [cols] = await connection.execute('DESCRIBE student');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('assignedTeacherId')) {
      console.log('Adding assignedTeacherId to student table...');
      await connection.execute('ALTER TABLE student ADD COLUMN assignedTeacherId INT DEFAULT NULL');
      await connection.execute('ALTER TABLE student ADD CONSTRAINT student_ibfk_2 FOREIGN KEY (assignedTeacherId) REFERENCES teacher (teacherId) ON DELETE SET NULL');
    }

    if (!colNames.includes('className')) {
      console.log('Adding className to student table...');
      await connection.execute('ALTER TABLE student ADD COLUMN className VARCHAR(255) DEFAULT NULL');
    }

    // Create audit_logs table
    console.log('Checking audit_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        logId INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        entityType VARCHAR(50) DEFAULT NULL,
        entityId INT DEFAULT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (logId),
        KEY idx_userId (userId),
        CONSTRAINT audit_logs_ibfk_1 FOREIGN KEY (userId) REFERENCES user (userId) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
