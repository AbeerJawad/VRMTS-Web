const mysql = require('mysql2/promise');
const config = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'vrmts'
};

async function check() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('DESCRIBE Quiz');
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
