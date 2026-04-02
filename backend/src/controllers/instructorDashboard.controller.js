const db = require('../config/db');

// Get class statistics for instructor dashboard
const getClassStats = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    // Total students assigned to this teacher
    const [totalStudentsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM Student s INNER JOIN User u ON s.userId = u.userId WHERE s.assignedTeacherId = ? AND u.userType = "student" AND u.isActive = TRUE',
      [teacherId]
    );

    // Average performance of students assigned to this teacher
    const [avgPerformanceResult] = await connection.execute(`
      SELECT AVG(qa.getScore) as avgScore
      FROM QuizAttempt qa
      INNER JOIN Student s ON qa.studentId = s.studentId
      WHERE qa.status = 'completed' AND qa.getScore IS NOT NULL AND s.assignedTeacherId = ?
    `, [teacherId]);

    // Modules assigned to students of this teacher
    const [modulesAssignedResult] = await connection.execute(
      'SELECT COUNT(DISTINCT sma.moduleId) as assignedModules FROM StudentModuleAssignment sma INNER JOIN Student s ON sma.studentId = s.studentId WHERE s.assignedTeacherId = ?',
      [teacherId]
    );

    // Total modules (global)
    const [totalModulesResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM Module'
    );

    // At-risk students assigned to this teacher
    const [atRiskResult] = await connection.execute(`
      SELECT COUNT(DISTINCT s.studentId) as atRiskCount
      FROM Student s
      INNER JOIN User u ON s.userId = u.userId
      WHERE s.assignedTeacherId = ? AND (
        s.studentId IN (
          SELECT studentId
          FROM QuizAttempt
          WHERE status = 'completed' AND getScore IS NOT NULL
          GROUP BY studentId
          HAVING AVG(getScore) < 60
        ) OR s.studentId IN (
          SELECT studentId
          FROM StudentModuleAssignment
          WHERE status != 'completed' AND status != 'archived'
          AND assignedAt IS NOT NULL
          AND assignedAt < DATE_SUB(NOW(), INTERVAL 14 DAY)
          GROUP BY studentId
          HAVING COUNT(*) >= 2
        )
      )
    `, [teacherId]);

    await connection.end();

    res.json({
      success: true,
      data: {
        totalStudents: totalStudentsResult[0]?.total || 0,
        averagePerformance: Math.round(avgPerformanceResult[0]?.avgScore || 0),
        modulesAssigned: modulesAssignedResult[0]?.assignedModules || 0,
        totalModules: totalModulesResult[0]?.total || 0,
        atRiskStudents: atRiskResult[0]?.atRiskCount || 0
      }
    });

  } catch (error) {
    console.error('Error in getClassStats:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class stats',
      error: error.message
    });
  }
};

// Get module performance overview
const getModulePerformance = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    const [modulePerformance] = await connection.execute(`
      SELECT 
        m.moduleId,
        m.title as module,
        COUNT(DISTINCT CASE WHEN sma.status = 'completed' THEN sma.studentId END) as completed,
        AVG(CASE WHEN qa.status = 'completed' AND qa.getScore IS NOT NULL THEN qa.getScore END) as avgScore,
        AVG(sma.hoursSpent) as avgHoursSpent,
        COUNT(DISTINCT sma.studentId) as totalAssigned
      FROM Module m
      LEFT JOIN StudentModuleAssignment sma ON m.moduleId = sma.moduleId
      INNER JOIN Student s ON sma.studentId = s.studentId
      LEFT JOIN Quiz q ON m.moduleId = q.moduleId
      LEFT JOIN QuizAttempt qa ON q.quizId = qa.quizId AND qa.status = 'completed' AND qa.getScore IS NOT NULL
      WHERE s.assignedTeacherId = ?
      GROUP BY m.moduleId, m.title
      ORDER BY avgScore DESC, completed DESC
      LIMIT 10
    `, [teacherId]);

    const [totalStudentsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM Student WHERE assignedTeacherId = ?',
      [teacherId]
    );
    const totalStudents = totalStudentsResult[0]?.total || 1;

    await connection.end();

    const performance = modulePerformance.map(module => {
      const avgScore = Math.round(module.avgScore || 0);
      const completed = parseInt(module.completed || 0);
      const avgHours = parseFloat(module.avgHoursSpent || 0).toFixed(1);
      
      let status = 'average';
      if (avgScore >= 85) status = 'excellent';
      else if (avgScore >= 75) status = 'good';
      else if (avgScore >= 65) status = 'average';
      else if (avgScore >= 50) status = 'needs-attention';
      else if (avgScore > 0) status = 'poor';

      return {
        module: module.module || 'Unknown',
        completed: completed,
        avgScore: avgScore,
        timeSpent: `${avgHours}h`,
        status: status
      };
    });

    res.json({
      success: true,
      data: performance,
      totalStudents: totalStudents
    });

  } catch (error) {
    console.error('Error in getModulePerformance:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to fetch module performance',
      error: error.message
    });
  }
};

// Get recent quiz submissions
const getRecentSubmissions = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    const [submissions] = await connection.execute(`
      SELECT 
        u.name as student,
        COALESCE(m.title, 'General Quiz') as module,
        qa.getScore as score,
        qa.finishAt as time
      FROM QuizAttempt qa
      INNER JOIN Student s ON qa.studentId = s.studentId
      INNER JOIN User u ON s.userId = u.userId
      INNER JOIN Quiz q ON qa.quizId = q.quizId
      LEFT JOIN Module m ON q.moduleId = m.moduleId
      WHERE qa.status = 'completed' 
      AND qa.finishAt IS NOT NULL 
      AND qa.getScore IS NOT NULL
      AND s.assignedTeacherId = ?
      ORDER BY qa.finishAt DESC
      LIMIT 10
    `, [teacherId]);

    await connection.end();

    const recentSubmissions = submissions.map(submission => {
      const score = Math.round(submission.score || 0);
      let status = 'average';
      if (score >= 80) status = 'excellent';
      else if (score >= 60) status = 'good';
      else if (score >= 50) status = 'needs-review';
      else status = 'poor';

      return {
        student: submission.student || 'Unknown',
        module: submission.module || 'General Quiz',
        score: score,
        time: getTimeAgo(submission.time),
        status: status
      };
    });

    res.json({
      success: true,
      data: recentSubmissions
    });

  } catch (error) {
    console.error('Error in getRecentSubmissions:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent submissions',
      error: error.message
    });
  }
};

// Get at-risk students
const getAtRiskStudents = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    const [atRiskStudents] = await connection.execute(`
      SELECT 
        u.name,
        s.studentId,
        AVG(CASE WHEN qa.status = 'completed' AND qa.getScore IS NOT NULL THEN qa.getScore END) as avgScore,
        COUNT(DISTINCT CASE 
          WHEN sma.status != 'completed' 
          AND sma.status != 'archived'
          AND sma.assignedAt IS NOT NULL
          AND sma.assignedAt < DATE_SUB(NOW(), INTERVAL 14 DAY) 
          THEN sma.assignmentId 
        END) as missedDeadlines,
        MAX(ls.startTime) as lastActive
      FROM Student s
      INNER JOIN User u ON s.userId = u.userId
      LEFT JOIN QuizAttempt qa ON s.studentId = qa.studentId AND qa.status = 'completed' AND qa.getScore IS NOT NULL
      LEFT JOIN StudentModuleAssignment sma ON s.studentId = sma.studentId
      LEFT JOIN LearningSession ls ON s.studentId = ls.studentId
      WHERE s.assignedTeacherId = ?
      GROUP BY s.studentId, u.name
      HAVING (
        AVG(CASE WHEN qa.status = 'completed' AND qa.getScore IS NOT NULL THEN qa.getScore END) < 60
        AND AVG(CASE WHEN qa.status = 'completed' AND qa.getScore IS NOT NULL THEN qa.getScore END) IS NOT NULL
      ) OR (
        COUNT(DISTINCT CASE 
          WHEN sma.status != 'completed' 
          AND sma.status != 'archived'
          AND sma.assignedAt IS NOT NULL
          AND sma.assignedAt < DATE_SUB(NOW(), INTERVAL 14 DAY) 
          THEN sma.assignmentId 
        END) >= 2
      )
      ORDER BY avgScore ASC, missedDeadlines DESC
      LIMIT 10
    `, [teacherId]);

    await connection.end();

    const students = atRiskStudents.map(student => {
      const avgScore = Math.round(student.avgScore || 0);
      const missedDeadlines = parseInt(student.missedDeadlines || 0);
      const lastActive = student.lastActive ? getTimeAgo(student.lastActive) : 'Never';
      
      let risk = 'medium';
      if ((avgScore > 0 && avgScore < 50) || missedDeadlines >= 4) risk = 'high';
      else if ((avgScore > 0 && avgScore < 60) || missedDeadlines >= 2) risk = 'medium';
      else risk = 'low';

      const initials = (student.name || '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'ST';

      return {
        name: student.name || 'Unknown',
        avatar: initials,
        avgScore: avgScore,
        missedDeadlines: missedDeadlines,
        lastActive: lastActive,
        risk: risk
      };
    });

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error in getAtRiskStudents:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to fetch at-risk students',
      error: error.message
    });
  }
};

// Get top performers
const getTopPerformers = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    const [topPerformers] = await connection.execute(`
      SELECT 
        u.name,
        s.studentId,
        AVG(CASE WHEN qa.status = 'completed' AND qa.getScore IS NOT NULL THEN qa.getScore END) as avgScore,
        COUNT(DISTINCT sma.moduleId) as modules
      FROM Student s
      INNER JOIN User u ON s.userId = u.userId
      LEFT JOIN QuizAttempt qa ON s.studentId = qa.studentId AND qa.status = 'completed' AND qa.getScore IS NOT NULL
      LEFT JOIN StudentModuleAssignment sma ON s.studentId = sma.studentId
      WHERE s.assignedTeacherId = ?
      GROUP BY s.studentId, u.name
      HAVING COUNT(qa.attemptId) > 0
      ORDER BY avgScore DESC, modules DESC
      LIMIT 10
    `, [teacherId]);

    await connection.end();

    const performers = topPerformers.map((student, index) => {
      const avgScore = Math.round(student.avgScore || 0);
      const modules = parseInt(student.modules || 0);

      const initials = (student.name || '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'ST';

      const badges = ['🏆', '🥇', '🥈', '🥉'];
      const badge = badges[index] || '⭐';

      return {
        name: student.name || 'Unknown',
        avatar: initials,
        avgScore: avgScore,
        modules: modules,
        badge: badge
      };
    });

    res.json({
      success: true,
      data: performers
    });

  } catch (error) {
    console.error('Error in getTopPerformers:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performers',
      error: error.message
    });
  }
};

// Get upcoming deadlines
const getUpcomingDeadlines = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    const [deadlines] = await connection.execute(`
      SELECT 
        m.title as assignment,
        DATE_ADD(sma.assignedAt, INTERVAL 14 DAY) as dueDate,
        COUNT(DISTINCT CASE WHEN sma.status = 'completed' THEN sma.studentId END) as studentsCompleted,
        COUNT(DISTINCT sma.studentId) as totalStudents
      FROM StudentModuleAssignment sma
      INNER JOIN Module m ON sma.moduleId = m.moduleId
      INNER JOIN Student s ON sma.studentId = s.studentId
      WHERE sma.status != 'completed' 
      AND sma.status != 'archived'
      AND sma.assignedAt IS NOT NULL
      AND s.assignedTeacherId = ?
      AND DATE_ADD(sma.assignedAt, INTERVAL 14 DAY) >= CURDATE()
      GROUP BY m.moduleId, m.title, DATE_ADD(sma.assignedAt, INTERVAL 14 DAY)
      ORDER BY dueDate ASC
      LIMIT 10
    `, [teacherId]);

    await connection.end();

    const upcomingDeadlines = deadlines
      .map(deadline => {
        if (!deadline.dueDate) return null;
        try {
          const dueDate = new Date(deadline.dueDate);
          if (isNaN(dueDate.getTime())) return null;
          const month = dueDate.toLocaleString('default', { month: 'short' });
          const day = dueDate.getDate();
          return {
            assignment: deadline.assignment || 'Unknown',
            dueDate: `${month} ${day}`,
            studentsCompleted: parseInt(deadline.studentsCompleted || 0),
            totalStudents: parseInt(deadline.totalStudents || 0)
          };
        } catch (e) {
          return null;
        }
      })
      .filter(d => d !== null);

    res.json({
      success: true,
      data: upcomingDeadlines
    });

  } catch (error) {
    console.error('Error in getUpcomingDeadlines:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming deadlines',
      error: error.message
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  if (!date) return 'Unknown';
  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return 'Unknown';
    
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } catch (e) {
    return 'Unknown';
  }
}

// Get students assigned to this instructor with stats
const getMyStudents = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();
    const [students] = await connection.execute(`
      SELECT 
        s.studentId, 
        u.name, 
        u.email, 
        s.enrollmentNumber, 
        s.className,
        (SELECT AVG(getScore) FROM QuizAttempt WHERE studentId = s.studentId AND status = 'completed') as avgScore,
        (SELECT COUNT(DISTINCT moduleId) FROM StudentModuleAssignment WHERE studentId = s.studentId AND status = 'completed') as modulesCompleted,
        (SELECT COUNT(*) FROM Module) as totalModules,
        (SELECT MAX(startTime) FROM LearningSession WHERE studentId = s.studentId) as lastActive
      FROM Student s
      INNER JOIN User u ON s.userId = u.userId
      WHERE s.assignedTeacherId = ? AND u.isActive = TRUE
    `, [teacherId]);

    await connection.end();
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error in getMyStudents:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign a module to a student
const assignModuleToStudent = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    const { studentId, moduleId } = req.body;
    if (!studentId || !moduleId) {
      return res.status(400).json({ success: false, message: 'Student ID and Module ID are required' });
    }

    connection = await db();

    // Verify student belongs to this teacher
    const [studentBatch] = await connection.execute(
      'SELECT studentId FROM Student WHERE studentId = ? AND assignedTeacherId = ?',
      [studentId, teacherId]
    );

    if (studentBatch.length === 0) {
      await connection.end();
      return res.status(403).json({ success: false, message: 'You can only assign modules to your own students' });
    }

    // Create assignment
    await connection.execute(
      'INSERT INTO StudentModuleAssignment (studentId, moduleId, status, assignedAt) VALUES (?, ?, "not_started", NOW()) ON DUPLICATE KEY UPDATE status = "not_started", assignedAt = NOW()',
      [studentId, moduleId]
    );

    await connection.end();
    res.json({ success: true, message: 'Module assigned successfully' });
  } catch (error) {
    console.error('Error in assignModuleToStudent:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign a module to an entire class (Batch)
const assignModuleToClass = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    const { className, moduleId } = req.body;
    if (!className || !moduleId) {
      return res.status(400).json({ success: false, message: 'Class Name and Module ID are required' });
    }

    connection = await db();

    // Get all students in this class assigned to this teacher
    const [students] = await connection.execute(
      'SELECT studentId FROM Student WHERE className = ? AND assignedTeacherId = ?',
      [className, teacherId]
    );

    if (students.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'No students found for the specified class' });
    }

    // Bulk insert using individual queries in a loop for simplicity and safety with ON DUPLICATE KEY 
    // (Actual bulk insert would be more complex with ON DUPLICATE KEY)
    for (const student of students) {
      await connection.execute(
        'INSERT INTO StudentModuleAssignment (studentId, moduleId, status, assignedAt) VALUES (?, ?, "not_started", NOW()) ON DUPLICATE KEY UPDATE status = "not_started", assignedAt = NOW()',
        [student.studentId, moduleId]
      );
    }

    await connection.end();
    res.json({ success: true, message: `Module assigned to ${students.length} students in ${className}` });
  } catch (error) {
    console.error('Error in assignModuleToClass:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active assignments for the tracking list
const getActiveAssignments = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();
    const [assignments] = await connection.execute(`
      SELECT 
        m.moduleId as id, 
        m.title as module, 
        COUNT(DISTINCT sma.studentId) as students, 
        DATE_FORMAT(MIN(sma.assignedAt), '%Y-%m-%d') as date
      FROM StudentModuleAssignment sma
      INNER JOIN Module m ON sma.moduleId = m.moduleId
      INNER JOIN Student s ON sma.studentId = s.studentId
      WHERE s.assignedTeacherId = ?
      GROUP BY m.moduleId, m.title
      ORDER BY MIN(sma.assignedAt) DESC
    `, [teacherId]);

    await connection.end();
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error in getActiveAssignments:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unassign a module from all students of this teacher (Batch)
const unassignModuleFromBatch = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    const { moduleId } = req.body;
    if (!moduleId) {
      return res.status(400).json({ success: false, message: 'Module ID is required' });
    }

    connection = await db();
    
    // Delete all assignments for this module where students belong to this teacher
    await connection.execute(`
      DELETE sma FROM StudentModuleAssignment sma
      INNER JOIN Student s ON sma.studentId = s.studentId
      WHERE s.assignedTeacherId = ? AND sma.moduleId = ?
    `, [teacherId, moduleId]);

    await connection.end();
    res.json({ success: true, message: 'Module unassigned from all students' });
  } catch (error) {
    console.error('Error in unassignModuleFromBatch:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unassign a specific student from a module
const unassignModuleFromStudent = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    const { studentId, moduleId } = req.body;
    if (!studentId || !moduleId) {
      return res.status(400).json({ success: false, message: 'Student ID and Module ID are required' });
    }

    connection = await db();

    // Verify student belongs to this teacher
    const [studentCheck] = await connection.execute(
      'SELECT studentId FROM Student WHERE studentId = ? AND assignedTeacherId = ?',
      [studentId, teacherId]
    );

    if (studentCheck.length === 0) {
      await connection.end();
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await connection.execute(
      'DELETE FROM StudentModuleAssignment WHERE studentId = ? AND moduleId = ?',
      [studentId, moduleId]
    );

    await connection.end();
    res.json({ success: true, message: 'Module unassigned from student' });
  } catch (error) {
    console.error('Error in unassignModuleFromStudent:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClassAnalytics = async (req, res) => {
  let connection;
  try {
    const teacherId = req.session.user.teacherId;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher ID not found in session' });
    }

    connection = await db();

    // 1. Overview Stats
    const [overview] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT s.studentId) as totalStudents,
        IFNULL(AVG(latest_scores.avg_score), 0) as avgGrade,
        COUNT(DISTINCT sma.moduleId) as modulesAssigned,
        IFNULL(SUM(CASE WHEN sma.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(sma.studentId), 0) * 100, 0) as completionRate,
        IFNULL(SUM(COALESCE(sma.hoursSpent, 0)), 0) as totalStudyHours
      FROM Student s
      LEFT JOIN StudentModuleAssignment sma ON s.studentId = sma.studentId
      LEFT JOIN (
        SELECT studentId, AVG(getScore) as avg_score 
        FROM QuizAttempt 
        WHERE status = 'completed'
        GROUP BY studentId
      ) latest_scores ON s.studentId = latest_scores.studentId
      WHERE s.assignedTeacherId = ?
    `, [teacherId]);

    // 2. Performance Trend (last 6 months)
    const [performanceTrend] = await connection.execute(`
      SELECT 
        DATE_FORMAT(finishAt, '%b') as month,
        AVG(getScore) as score
      FROM QuizAttempt qa
      INNER JOIN Student s ON qa.studentId = s.studentId
      WHERE s.assignedTeacherId = ?
      AND qa.status = 'completed'
      AND qa.finishAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(finishAt, '%Y-%m'), month
      ORDER BY MIN(finishAt) ASC
    `, [teacherId]);

    // 3. Module Breakdown
    const [moduleBreakdown] = await connection.execute(`
      SELECT 
        m.title as name,
        IFNULL(SUM(CASE WHEN sma.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(sma.studentId), 0) * 100, 0) as completion,
        IFNULL(AVG(qa_avg.avg_score), 0) as avgScore
      FROM Module m
      INNER JOIN StudentModuleAssignment sma ON m.moduleId = sma.moduleId
      INNER JOIN Student s ON sma.studentId = s.studentId
      LEFT JOIN (
        SELECT q.moduleId, qa.studentId, AVG(qa.getScore) as avg_score
        FROM QuizAttempt qa
        JOIN Quiz q ON qa.quizId = q.quizId
        WHERE qa.status = 'completed'
        GROUP BY q.moduleId, qa.studentId
      ) qa_avg ON (m.moduleId = qa_avg.moduleId AND s.studentId = qa_avg.studentId)
      WHERE s.assignedTeacherId = ?
      GROUP BY m.moduleId
    `, [teacherId]);

    // 4. Batch Comparison
    const [batchPerformance] = await connection.execute(`
      SELECT 
        s.className as name,
        COUNT(DISTINCT s.studentId) as students,
        IFNULL(AVG(qa.getScore), 0) as avgPerformance,
        IFNULL(SUM(CASE WHEN sma.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(sma.studentId), 0) * 100, 0) as completionRate
      FROM Student s
      LEFT JOIN StudentModuleAssignment sma ON s.studentId = sma.studentId
      LEFT JOIN QuizAttempt qa ON s.studentId = qa.studentId
      WHERE s.assignedTeacherId = ?
      GROUP BY s.className
    `, [teacherId]);

    await connection.end();

    res.json({
      success: true,
      data: {
        overview: overview[0],
        performanceTrend,
        moduleBreakdown,
        batchPerformance
      }
    });

  } catch (error) {
    console.error('Error in getClassAnalytics:', error);
    if (connection) await connection.end().catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClassStats,
  getModulePerformance,
  getRecentSubmissions,
  getAtRiskStudents,
  getTopPerformers,
  getUpcomingDeadlines,
  getMyStudents,
  assignModuleToStudent,
  assignModuleToClass,
  getActiveAssignments,
  unassignModuleFromBatch,
  unassignModuleFromStudent,
  getClassAnalytics
};
