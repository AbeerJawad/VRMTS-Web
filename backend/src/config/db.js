const mysql = require('mysql2/promise');
require('dotenv').config();

async function connectDB() {
  try {
    const dbConfig = process.env.MYSQL_URL || {
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME
    };
    const connection = await mysql.createConnection(dbConfig);

    console.log('connection successfull');
    return connection;
  } catch (error) {
    console.error('connection failed:', error.message);
    process.exit(1); 
  }
}

module.exports = connectDB;
