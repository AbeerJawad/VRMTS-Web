const db = require('./db');

async function check() {
  let conn;
  try {
    conn = await db();
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('Tables:', tables);

    const [studentCols] = await conn.execute('DESCRIBE Student');
    console.log('Student Columns:', studentCols);

    const [assignmentCols] = await conn.execute('DESCRIBE StudentModuleAssignment');
    console.log('Assignment Columns:', assignmentCols);

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    if (conn) await conn.end();
  }
}

check();
