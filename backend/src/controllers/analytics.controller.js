const db = require('../config/db');

// Get student analytics data
const getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.session.user.userId;

    // Check if user is a student
    if (req.session.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only students can view analytics.'
      });
    }

    const connection = await db();

    // Get studentId from userId
    const [students] = await connection.execute(
      'SELECT studentId FROM Student WHERE userId = ?',
      [userId]
    );

    if (students.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentId = students[0].studentId;

    // Get overview stats
    const [modulesCompleted] = await connection.execute(`
      SELECT COUNT(DISTINCT moduleId) as count
      FROM StudentModuleAssignment
      WHERE studentId = ? AND status = 'completed'
    `, [studentId]);

    const [totalModules] = await connection.execute(`
      SELECT COUNT(*) as count FROM Module
    `);

    const [averageScore] = await connection.execute(`
      SELECT COALESCE(AVG(getScore), 0) as avg
      FROM QuizAttempt
      WHERE studentId = ? AND status = 'completed' AND getScore IS NOT NULL
    `, [studentId]);

    const [totalStudyTime] = await connection.execute(`
      SELECT COALESCE(SUM(hoursSpent), 0) as total
      FROM StudentModuleAssignment
      WHERE studentId = ?
    `, [studentId]);

    const [quizzesTaken] = await connection.execute(`
      SELECT COUNT(DISTINCT attemptId) as count
      FROM QuizAttempt
      WHERE studentId = ? AND status = 'completed'
    `, [studentId]);

    const [totalSessions] = await connection.execute(`
      SELECT COUNT(DISTINCT sessionId) as count
      FROM LearningSession
      WHERE studentId = ?
    `, [studentId]);

    const overviewResult = [{
      modulesCompleted: modulesCompleted[0]?.count || 0,
      totalModules: totalModules[0]?.count || 0,
      averageScore: averageScore[0]?.avg || 0,
      totalStudyTime: totalStudyTime[0]?.total || 0,
      quizzesTaken: quizzesTaken[0]?.count || 0,
      totalSessions: totalSessions[0]?.count || 0
    }];

    // Calculate streak (consecutive days with activity)
    const [streakData] = await connection.execute(`
      SELECT DISTINCT DATE(COALESCE(ls.startTime, qa.startTime)) as activityDate
      FROM Student s
      LEFT JOIN LearningSession ls ON ls.studentId = s.studentId
      LEFT JOIN QuizAttempt qa ON qa.studentId = s.studentId
      WHERE s.studentId = ?
        AND (ls.startTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          OR qa.startTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      ORDER BY activityDate DESC
    `, [studentId]);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = today;

    for (let i = 0; i < streakData.length; i++) {
      const activityDate = new Date(streakData[i].activityDate).toISOString().split('T')[0];
      const expectedDate = new Date(checkDate).toISOString().split('T')[0];
      
      if (activityDate === expectedDate) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
        checkDate = new Date(new Date(checkDate).setDate(new Date(checkDate).getDate() - 1)).toISOString().split('T')[0];
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
        break;
      }
    }

    // Get score progress over time (last 4 months)
    const [scoreProgress] = await connection.execute(`
      SELECT
        DATE_FORMAT(qa.finishAt, '%b') as month,
        ROUND(AVG(qa.getScore)) as score
      FROM QuizAttempt qa
      WHERE qa.studentId = ? 
        AND qa.status = 'completed'
        AND qa.finishAt >= DATE_SUB(NOW(), INTERVAL 4 MONTH)
        AND qa.getScore IS NOT NULL
      GROUP BY DATE_FORMAT(qa.finishAt, '%Y-%m'), DATE_FORMAT(qa.finishAt, '%b')
      ORDER BY DATE_FORMAT(qa.finishAt, '%Y-%m') ASC
    `, [studentId]);

    // Get weekly study time (last 7 days)
    const [studyTime] = await connection.execute(`
      SELECT
        DAYNAME(ls.startTime) as day,
        ROUND(COALESCE(SUM(ls.duration), 0) / 60.0, 1) as hours
      FROM LearningSession ls
      WHERE ls.studentId = ? 
        AND ls.startTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DAYOFWEEK(ls.startTime), DAYNAME(ls.startTime)
      ORDER BY DAYOFWEEK(ls.startTime)
    `, [studentId]);

    // Fill in missing days with 0
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const studyTimeMap = {};
    studyTime.forEach(row => {
      studyTimeMap[row.day] = row.hours;
    });
    const studyTimeComplete = daysOfWeek.map(day => ({
      day: day.substring(0, 3),
      hours: parseFloat(studyTimeMap[day] || 0)
    }));

    // Get module performance
    const [modulePerformance] = await connection.execute(`
      SELECT
        m.title as module,
        COALESCE(sma.progress, 0) as progress,
        COALESCE(AVG(qa.getScore), 0) as avgScore,
        COALESCE(SUM(sma.hoursSpent), 0) as timeSpent,
        MAX(qa.finishAt) as lastAttempt,
        COALESCE(sma.status, 'not_started') as status
      FROM Module m
      LEFT JOIN StudentModuleAssignment sma ON m.moduleId = sma.moduleId AND sma.studentId = ?
      LEFT JOIN Quiz q ON q.moduleId = m.moduleId
      LEFT JOIN QuizAttempt qa ON qa.quizId = q.quizId AND qa.studentId = ? AND qa.status = 'completed'
      GROUP BY m.moduleId, m.title, sma.progress, sma.status
      ORDER BY m.title
    `, [studentId, studentId]);

    // Get question type performance
    const [questionTypePerformance] = await connection.execute(`
      SELECT
        CASE 
          WHEN qb.questionType = 'multiple_choice' THEN 'Multiple Choice'
          WHEN qb.questionType = 'labeling' THEN 'Labeling'
          WHEN qb.questionType = 'drag_drop' THEN 'Drag & Drop'
          WHEN qb.questionType = 'true_false' THEN 'True/False'
          WHEN qb.questionType = 'short_answer' THEN 'Short Answer'
          ELSE 'Other'
        END as type,
        COUNT(ar.recordId) as total,
        SUM(CASE WHEN ar.isCorrect = 1 THEN 1 ELSE 0 END) as correct,
        ROUND((SUM(CASE WHEN ar.isCorrect = 1 THEN 1 ELSE 0 END) / COUNT(ar.recordId)) * 100) as percentage
      FROM AnswerRecord ar
      JOIN QuizQuestion qq ON ar.questionId = qq.questionId
      JOIN QuestionBank qb ON qq.bankId = qb.bankId
      JOIN QuizAttempt qa ON ar.attemptId = qa.attemptId
      WHERE qa.studentId = ? AND qa.status = 'completed'
      GROUP BY qb.questionType
    `, [studentId]);

    // Get recent activity
    const [recentActivity] = await connection.execute(`
      (
        SELECT
          DATE_FORMAT(qa.finishAt, '%b %d, %Y') as date,
          'Completed Quiz' as action,
          m.title as module,
          qa.getScore as score,
          NULL as duration,
          DATE_FORMAT(qa.finishAt, '%H:%i') as time
        FROM QuizAttempt qa
        JOIN Quiz q ON qa.quizId = q.quizId
        LEFT JOIN Module m ON q.moduleId = m.moduleId
        WHERE qa.studentId = ? AND qa.status = 'completed' AND qa.finishAt IS NOT NULL
        ORDER BY qa.finishAt DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT
          DATE_FORMAT(ls.startTime, '%b %d, %Y') as date,
          'Studied Module' as action,
          m.title as module,
          NULL as score,
          CONCAT(ROUND(ls.duration / 60.0, 1), 'h') as duration,
          DATE_FORMAT(ls.startTime, '%H:%i') as time
        FROM LearningSession ls
        LEFT JOIN Module m ON ls.moduleId = m.moduleId
        WHERE ls.studentId = ? AND ls.sessionType = 'study'
        ORDER BY ls.startTime DESC
        LIMIT 5
      )
      ORDER BY date DESC, time DESC
      LIMIT 5
    `, [studentId, studentId]);

    // Get strengths (topics with >85% mastery)
    const [strengths] = await connection.execute(`
      SELECT
        qb.topic,
        ROUND(AVG(CASE WHEN ar.isCorrect = 1 THEN 100 ELSE 0 END)) as mastery,
        COUNT(ar.recordId) as questions
      FROM AnswerRecord ar
      JOIN QuizQuestion qq ON ar.questionId = qq.questionId
      JOIN QuestionBank qb ON qq.bankId = qb.bankId
      JOIN QuizAttempt qa ON ar.attemptId = qa.attemptId
      WHERE qa.studentId = ? AND qa.status = 'completed' AND qb.topic IS NOT NULL
      GROUP BY qb.topic
      HAVING mastery >= 85
      ORDER BY mastery DESC, questions DESC
      LIMIT 3
    `, [studentId]);

    // Get weaknesses (topics with <75% mastery)
    const [weaknesses] = await connection.execute(`
      SELECT
        qb.topic,
        ROUND(AVG(CASE WHEN ar.isCorrect = 1 THEN 100 ELSE 0 END)) as mastery,
        COUNT(ar.recordId) as questions
      FROM AnswerRecord ar
      JOIN QuizQuestion qq ON ar.questionId = qq.questionId
      JOIN QuestionBank qb ON qq.bankId = qb.bankId
      JOIN QuizAttempt qa ON ar.attemptId = qa.attemptId
      WHERE qa.studentId = ? AND qa.status = 'completed' AND qb.topic IS NOT NULL
      GROUP BY qb.topic
      HAVING mastery < 75 AND questions >= 3
      ORDER BY mastery ASC, questions DESC
      LIMIT 3
    `, [studentId]);

    // Get learning pattern
    const [learningPattern] = await connection.execute(`
      SELECT
        CASE DAYOFWEEK(ls.startTime)
          WHEN 1 THEN 'Sunday'
          WHEN 2 THEN 'Monday'
          WHEN 3 THEN 'Tuesday'
          WHEN 4 THEN 'Wednesday'
          WHEN 5 THEN 'Thursday'
          WHEN 6 THEN 'Friday'
          WHEN 7 THEN 'Saturday'
        END as mostActiveDay,
        COUNT(*) as sessions
      FROM LearningSession ls
      WHERE ls.studentId = ?
      GROUP BY DAYOFWEEK(ls.startTime), 
               CASE DAYOFWEEK(ls.startTime)
                 WHEN 1 THEN 'Sunday'
                 WHEN 2 THEN 'Monday'
                 WHEN 3 THEN 'Tuesday'
                 WHEN 4 THEN 'Wednesday'
                 WHEN 5 THEN 'Thursday'
                 WHEN 6 THEN 'Friday'
                 WHEN 7 THEN 'Saturday'
               END
      ORDER BY sessions DESC
      LIMIT 1
    `, [studentId]);

    const [timePattern] = await connection.execute(`
      SELECT
        FLOOR(HOUR(ls.startTime) / 4) as hourBucket,
        COUNT(*) as sessions
      FROM LearningSession ls
      WHERE ls.studentId = ?
      GROUP BY FLOOR(HOUR(ls.startTime) / 4)
      ORDER BY sessions DESC
      LIMIT 1
    `, [studentId]);

    // Format the time range from hour bucket
    let timeRangeFormatted = 'N/A';
    if (timePattern.length > 0 && timePattern[0].hourBucket !== null) {
      const hourBucket = timePattern[0].hourBucket;
      const startHour = hourBucket * 4;
      const endHour = startHour + 4;
      
      const formatHour = (hour) => {
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${displayHour}${ampm}`;
      };
      
      timeRangeFormatted = `${formatHour(startHour)} - ${formatHour(endHour)}`;
    }

    const [avgSession] = await connection.execute(`
      SELECT ROUND(AVG(ls.duration)) as avgSessionLength
      FROM LearningSession ls
      WHERE ls.studentId = ?
    `, [studentId]);

    const [preferredFormatData] = await connection.execute(`
      SELECT sessionType, COUNT(*) as count
      FROM LearningSession
      WHERE studentId = ?
      GROUP BY sessionType
      ORDER BY count DESC
      LIMIT 1
    `, [studentId]);

    const preferredFormat = preferredFormatData.length > 0 
      ? (preferredFormatData[0].sessionType === 'vr' ? 'VR Session' : 'Web Module')
      : 'Web Module';

    const [perfectScores] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM QuizAttempt
      WHERE studentId = ? AND getScore = 100 AND status = 'completed'
    `, [studentId]);

    await connection.end();

    // Format last attempt dates
    const formatLastAttempt = (date) => {
      if (!date) return 'Never';
      const now = new Date();
      const attemptDate = new Date(date);
      const diffTime = Math.abs(now - attemptDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    };

    const analyticsData = {
      overview: {
        totalStudyTime: parseFloat(overviewResult[0].totalStudyTime || 0).toFixed(1),
        modulesCompleted: overviewResult[0].modulesCompleted || 0,
        totalModules: overviewResult[0].totalModules || 0,
        averageScore: Math.round(parseFloat(overviewResult[0].averageScore || 0)),
        quizzesTaken: overviewResult[0].quizzesTaken || 0,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        totalSessions: overviewResult[0].totalSessions || 0
      },
      scoreProgress: scoreProgress.map(row => ({
        month: row.month,
        score: Math.round(parseFloat(row.score || 0))
      })),
      studyTime: studyTimeComplete,
      modulePerformance: modulePerformance.map(row => ({
        module: row.module || 'Unknown',
        progress: Math.round(parseFloat(row.progress || 0)),
        avgScore: Math.round(parseFloat(row.avgScore || 0)),
        timeSpent: `${parseFloat(row.timeSpent || 0).toFixed(1)}h`,
        lastAttempt: formatLastAttempt(row.lastAttempt),
        status: row.status === 'completed' ? 'completed' : 'in-progress'
      })),
      questionTypePerformance: questionTypePerformance.map(row => ({
        type: row.type || 'Unknown',
        correct: row.correct || 0,
        total: row.total || 0,
        percentage: row.percentage || 0
      })),
      recentActivity: recentActivity.map(row => ({
        date: row.date || '',
        action: row.action || '',
        module: row.module || 'Unknown',
        score: row.score ? Math.round(parseFloat(row.score)) : undefined,
        duration: row.duration || undefined,
        time: row.time || undefined
      })),
      strengths: strengths.map(row => ({
        topic: row.topic || 'Unknown',
        mastery: Math.round(parseFloat(row.mastery || 0)),
        questions: row.questions || 0
      })),
      weaknesses: weaknesses.map(row => ({
        topic: row.topic || 'Unknown',
        mastery: Math.round(parseFloat(row.mastery || 0)),
        questions: row.questions || 0
      })),
      learningPattern: {
        mostActiveDay: learningPattern[0]?.mostActiveDay || 'N/A',
        mostActiveTime: timeRangeFormatted,
        avgSessionLength: avgSession[0]?.avgSessionLength ? `${Math.round(parseFloat(avgSession[0].avgSessionLength))} mins` : 'N/A',
        preferredFormat: preferredFormat
      },
      achievements: [
        { name: 'Course Initiated', icon: 'Trophy', unlocked: (overviewResult[0].quizzesTaken || 0) > 0, date: undefined },
        { name: 'Consistent Learner', icon: 'Zap', unlocked: currentStreak >= 7, date: undefined },
        { name: 'Excellence Attained', icon: 'Award', unlocked: (perfectScores[0]?.count || 0) > 0, date: undefined },
        { name: 'Subject Specialist', icon: 'BookOpen', unlocked: (overviewResult[0].modulesCompleted || 0) >= 5, date: undefined },
        { name: 'Dedicated Scholar', icon: 'Target', unlocked: longestStreak >= 14, date: undefined },
        { name: 'Efficiency Expert', icon: 'Clock', unlocked: (avgSession[0]?.avgSessionLength || 0) > 0 && (avgSession[0]?.avgSessionLength || 0) < 30, date: undefined }
      ]
    };

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
};

module.exports = {
  getStudentAnalytics
};

