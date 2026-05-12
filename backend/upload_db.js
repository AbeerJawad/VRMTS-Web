const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Put your Railway MYSQL_URL here before running!
const railwayURL = process.env.MYSQL_URL || "PASTE_RAILWAY_URL_HERE";

async function uploadDatabase() {
    if (railwayURL === "PASTE_RAILWAY_URL_HERE") {
        console.error("❌ Please paste your Railway MYSQL_URL into this file first!");
        process.exit(1);
    }

    let connection;
    try {
        console.log("Connecting to Railway database...");
        connection = await mysql.createConnection(railwayURL + "?multipleStatements=true");
        
        console.log("Reading dbtables.sql...");
        const sql = fs.readFileSync('dbtables.sql', 'utf8');

        console.log("Executing SQL (this might take a moment)...");
        await connection.query(sql);

        console.log("✅ Database uploaded successfully!");
    } catch (error) {
        console.error("❌ Error uploading database:", error.message);
    } finally {
        if (connection) await connection.end();
    }
}

uploadDatabase();
