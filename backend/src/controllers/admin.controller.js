const db = require('../config/db');

// Helper to log administrative actions
const logAction = async (connection, adminId, action, entityType, entityId, details) => {
  try {
    await connection.execute(
      'INSERT INTO audit_logs (userId, action, entityType, entityId, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, action, entityType, entityId, details]
    );
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};

const os = require('os');

// Get Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const connection = await db();
    
    const [dbStats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM student) as totalStudents,
        (SELECT COUNT(*) FROM teacher) as totalFaculty,
        (SELECT COUNT(*) FROM module) as totalModules,
        (SELECT COUNT(*) FROM audit_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recentActions
    `);

    const [activity] = await connection.execute(`
      SELECT a.*, u.name as adminName 
      FROM audit_logs a 
      JOIN user u ON a.userId = u.userId 
      ORDER BY timestamp DESC LIMIT 5
    `);

    await connection.end();

    // System Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const cpuLoad = Math.round(os.loadavg()[0] * 10) || 5; // Fallback for Windows where loadavg is often [0,0,0]

    const stats = {
      ...dbStats[0],
      system: {
        cpu: cpuLoad > 100 ? 99 : cpuLoad,
        memory: memUsage,
        network: Math.floor(Math.random() * 30) + 10, // Simulated network load
        disk: 65 // Simulated disk usage
      }
    };

    res.json({ success: true, stats, recentActivity: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List Students with Teacher/Class Info
const getStudents = async (req, res) => {
  try {
    const connection = await db();
    const [students] = await connection.execute(`
      SELECT 
        s.studentId, s.userId, s.enrollmentNumber, s.className, s.assignedTeacherId,
        u.name, u.email, u.isActive, u.lastLogin,
        t_user.name as teacherName
      FROM student s
      JOIN user u ON s.userId = u.userId
      LEFT JOIN teacher t ON s.assignedTeacherId = t.teacherId
      LEFT JOIN user t_user ON t.userId = t_user.userId
    `);
    await connection.end();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Faculty Account
const createFacultyAccount = async (req, res) => {
  const { name, email, department, password } = req.body;
  const adminId = req.session.user.userId;

  try {
    const connection = await db();
    await connection.beginTransaction();

    try {
      // Create user entry
      const [userResult] = await connection.execute(
        'INSERT INTO user (email, passwordHash, name, userType) VALUES (?, ?, ?, ?)',
        [email, password, name, 'teacher']
      );
      const userId = userResult.insertId;

      // Create teacher entry
      const [teacherResult] = await connection.execute(
        'INSERT INTO teacher (userId, department) VALUES (?, ?)',
        [userId, department]
      );

      await logAction(connection, adminId, 'CREATE_FACULTY', 'teacher', teacherResult.insertId, `Created faculty ${name}`);

      await connection.commit();
      res.json({ success: true, message: 'Faculty account created' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Upload Students
const bulkUploadStudents = async (req, res) => {
  const { students } = req.body; // Array of { name, email, enrollmentNumber, className, teacherId, password }
  const adminId = req.session.user.userId;

  try {
    const connection = await db();
    await connection.beginTransaction();

    try {
      for (const s of students) {
        // Create user
        const [uResult] = await connection.execute(
          'INSERT INTO user (email, passwordHash, name, userType) VALUES (?, ?, ?, ?)',
          [s.email, s.password, s.name, 'student']
        );
        const userId = uResult.insertId;

        // Create student
        await connection.execute(
          'INSERT INTO student (userId, enrollmentNumber, enrollmentDate, assignedTeacherId, className) VALUES (?, ?, NOW(), ?, ?)',
          [userId, s.enrollmentNumber, s.teacherId || null, s.className || null]
        );
      }

      await logAction(connection, adminId, 'BULK_UPLOAD_STUDENTS', 'student', null, `Uploaded ${students.length} students`);

      await connection.commit();
      res.json({ success: true, message: `Successfully uploaded ${students.length} students` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Student Status
const updateStudentStatus = async (req, res) => {
  const { userId, isActive } = req.body;
  const adminId = req.session.user.userId;

  try {
    const connection = await db();
    await connection.execute('UPDATE user SET isActive = ? WHERE userId = ?', [isActive ? 1 : 0, userId]);
    await logAction(connection, adminId, isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'user', userId, `Changed status to ${isActive}`);
    await connection.end();
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign Teacher to Student
const assignTeacherToStudent = async (req, res) => {
  const { studentId, teacherId, className } = req.body;
  const adminId = req.session.user.userId;

  try {
    const connection = await db();
    await connection.execute(
      'UPDATE student SET assignedTeacherId = ?, className = ? WHERE studentId = ?',
      [teacherId, className, studentId]
    );
    await logAction(connection, adminId, 'ASSIGN_TEACHER', 'student', studentId, `Assigned teacher ${teacherId} for class ${className}`);
    await connection.end();
    res.json({ success: true, message: 'Teacher assigned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Global Announcement
const sendGlobalAnnouncement = async (req, res) => {
  const { title, message, type } = req.body;
  const adminId = req.session.user.userId;

  try {
    const connection = await db();
    const [users] = await connection.execute('SELECT userId FROM user WHERE isActive = 1');
    
    for (const u of users) {
      await connection.execute(
        'INSERT INTO notification (userId, title, message, notificationType) VALUES (?, ?, ?, ?)',
        [u.userId, title, message, type || 'info']
      );
    }

    await logAction(connection, adminId, 'SEND_ANNOUNCEMENT', 'notification', null, `Title: ${title}`);
    await connection.end();
    res.json({ success: true, message: 'Announcement sent to all active users' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Teachers
const getTeachers = async (req, res) => {
  try {
    const connection = await db();
    const [teachers] = await connection.execute(`
      SELECT t.teacherId, u.name, t.department 
      FROM teacher t 
      JOIN user u ON t.userId = u.userId 
      WHERE u.isActive = 1
    `);
    await connection.end();
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Audit Logs
const getAuditLogs = async (req, res) => {
  try {
    const connection = await db();
    const [logs] = await connection.execute(`
      SELECT a.*, u.name as userName 
      FROM audit_logs a 
      JOIN user u ON a.userId = u.userId 
      ORDER BY timestamp DESC LIMIT 100
    `);
    await connection.end();
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  createFacultyAccount,
  bulkUploadStudents,
  updateStudentStatus,
  assignTeacherToStudent,
  sendGlobalAnnouncement,
  getTeachers,
  getAuditLogs
};
