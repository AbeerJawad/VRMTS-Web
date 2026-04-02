const mysql = require('mysql2/promise');
require('dotenv').config();

async function initStagingTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '1234',
            database: process.env.DB_NAME || 'vrmts'
        });

        console.log('✅ Connected to database');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ai_question_staging (
                stagingId INT AUTO_INCREMENT PRIMARY KEY,
                instructorId INT NOT NULL,
                labNum INT NOT NULL,
                questionText TEXT NOT NULL,
                options JSON NOT NULL,
                correctIndex INT NOT NULL,
                explanation TEXT,
                difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;

        await connection.execute(createTableQuery);
        console.log('✅ Table "ai_question_staging" created or already exists.');

    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

initStagingTable();
