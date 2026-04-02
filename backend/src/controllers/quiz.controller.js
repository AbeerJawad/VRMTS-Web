const db = require('../config/db');

// Get available modules for quiz selection
const getQuizModules = async (req, res) => {
  try {
    const userId = req.session.user.userId;
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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Get modules with quiz information (only assigned modules for the student)
    const [modules] = await connection.execute(`
      SELECT
        m.moduleId,
        m.title AS name,
        m.description,
        m.difficultyLevel as difficulty,
        COUNT(DISTINCT q.quizId) as quizCount,
        COUNT(DISTINCT qq.questionId) as totalQuestions
      FROM Module m
      LEFT JOIN StudentModuleAssignment sma ON m.moduleId = sma.moduleId AND sma.studentId = ?
      LEFT JOIN Quiz q ON m.moduleId = q.moduleId
      LEFT JOIN QuizQuestion qq ON q.quizId = qq.quizId
      LEFT JOIN QuestionBank qb ON qq.bankId = qb.bankId
      WHERE sma.studentId IS NOT NULL
      GROUP BY m.moduleId, m.title, m.description, m.difficultyLevel
      ORDER BY m.title ASC
    `, [studentId]);

    await connection.end();

    res.json({
      success: true,
      data: modules
    });

  } catch (error) {
    console.error('Error fetching quiz modules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz modules',
      error: error.message
    });
  }
};

// Get quiz statistics for the student
const getQuizStats = async (req, res) => {
  try {
    const userId = req.session.user.userId;
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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Get overall quiz statistics
    const [stats] = await connection.execute(`
      SELECT
        COUNT(DISTINCT qa.attemptId) as totalAttempts,
        COUNT(DISTINCT CASE WHEN qa.status = 'completed' THEN qa.attemptId END) as completedAttempts,
        COUNT(DISTINCT CASE WHEN qa.status = 'completed' AND qa.getScore >= COALESCE(q.passingScore, 60) THEN qa.attemptId END) as passedAttempts,
        AVG(qa.getScore) as averageScore,
        MAX(qa.getScore) as highestScore,
        SUM(TIMESTAMPDIFF(MINUTE, qa.startTime, qa.endTime)) as totalTimeSpent,
        COUNT(DISTINCT q.quizId) as uniqueQuizzesTaken
      FROM QuizAttempt qa
      JOIN Quiz q ON qa.quizId = q.quizId
      WHERE qa.studentId = ?
    `, [studentId]);

    await connection.end();

    const statData = stats[0] || {
      totalAttempts: 0,
      completedAttempts: 0,
      passedAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      totalTimeSpent: 0,
      uniqueQuizzesTaken: 0
    };

    // Transform to match frontend interface
    const transformedStats = {
      quizzesTaken: statData.totalAttempts,
      averageScore: Math.round(parseFloat(statData.averageScore || 0)),
      passRate: statData.completedAttempts > 0 ? Math.round((statData.passedAttempts / statData.completedAttempts) * 100) : 0,
      totalTime: Math.round((statData.totalTimeSpent || 0) / 60) // Convert minutes to hours
    };

    res.json({
      success: true,
      data: transformedStats
    });

  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      error: error.message
    });
  }
};

// Start a module quiz
const startModuleQuiz = async (req, res) => {
  let connection = null;
  try {
    // Validate session
    if (!req.session?.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.session.user.userId;
    const moduleId = parseInt(req.params.moduleId, 10);
    const quizId = req.query.quizId ? parseInt(req.query.quizId, 10) : null;

    if (isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID'
      });
    }

    connection = await db();

    // Get studentId from userId
    const [students] = await connection.execute(
      'SELECT studentId FROM Student WHERE userId = ?',
      [userId]
    );

    if (students.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Check for existing in-progress attempts for this student
    const [existingAttempts] = await connection.execute(
      'SELECT attemptId, quizId, startTime FROM QuizAttempt WHERE studentId = ? AND status = "in_progress" ORDER BY startTime DESC',
      [studentId]
    );

    if (existingAttempts.length > 0) {
      for (const attempt of existingAttempts) {
        // Get details of what this attempt is for
        const [details] = await connection.execute(
          'SELECT moduleId, quizId, passingScore FROM Quiz WHERE quizId = ?',
          [attempt.quizId]
        );

        if (details.length > 0) {
          const isSameQuiz = quizId && details[0].quizId === quizId;
          const isSameModulePractice = !quizId && details[0].moduleId === moduleId;

          if (isSameQuiz || isSameModulePractice) {
            // Found a direct match - RESUME this one
            const [fullDetails] = await connection.execute(`
              SELECT q.quizId, q.timeLimit, q.totalQuestions, q.passingScore
              FROM Quiz q
              WHERE q.quizId = ?
            `, [attempt.quizId]);

            await connection.end();
            return res.json({
              success: true,
              data: {
                attemptId: attempt.attemptId,
                quizId: fullDetails[0].quizId,
                timeLimit: fullDetails[0].timeLimit,
                totalQuestions: fullDetails[0].totalQuestions,
                passingScore: fullDetails[0].passingScore,
                isResume: true
              }
            });
          }
        }
      }
    }

    // Verify module exists
    const [modules] = await connection.execute(
      'SELECT moduleId, title FROM Module WHERE moduleId = ?',
      [moduleId]
    );

    if (modules.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // If specific quizId is provided, skip generation and use it
    if (quizId) {
      // Verify quiz exists and belongs to the module
      const [existingQuizzes] = await connection.execute(
        'SELECT * FROM Quiz WHERE quizId = ? AND moduleId = ?',
        [quizId, moduleId]
      );

      if (existingQuizzes.length === 0) {
        await connection.end();
        return res.status(404).json({
          success: false,
          message: 'Specified quiz not found for this module'
        });
      }

      const quizData = existingQuizzes[0];

      // Create quiz attempt for existing quiz
      const [attemptResult] = await connection.execute(
        'INSERT INTO QuizAttempt (studentId, quizId, startTime, status) VALUES (?, ?, NOW(), "in_progress")',
        [studentId, quizId]
      );

      await connection.end();

      return res.json({
        success: true,
        data: {
          attemptId: attemptResult.insertId,
          quizId,
          timeLimit: quizData.timeLimit,
          totalQuestions: quizData.totalQuestions,
          passingScore: quizData.passingScore
        }
      });
    }

    // --- EFFECTIVE ARCHITECTURE: MASTER PRACTICE QUIZ FLOW ---

    // 1. Find or create the Master Practice Quiz for this module
    const practiceTitle = `Practice: ${modules[0].title}`;
    let [masterQuizzes] = await connection.execute(
      'SELECT quizId, timeLimit, totalQuestions, passingScore FROM Quiz WHERE moduleId = ? AND isCustom = 0 AND title = ? LIMIT 1',
      [moduleId, practiceTitle]
    );

    let finalQuizId;
    let quizConfig = { timeLimit: 30, totalQuestions: 15, passingScore: 60 };

    if (masterQuizzes.length > 0) {
      finalQuizId = masterQuizzes[0].quizId;
      quizConfig = {
        timeLimit: masterQuizzes[0].timeLimit || 30,
        totalQuestions: masterQuizzes[0].totalQuestions || 15,
        passingScore: masterQuizzes[0].passingScore || 60
      };
    } else {
      // Create master quiz record
      const [insertResult] = await connection.execute(
        'INSERT INTO Quiz (moduleId, title, timeLimit, totalQuestions, passingScore, isCustom) VALUES (?, ?, ?, ?, ?, 0)',
        [moduleId, practiceTitle, quizConfig.timeLimit, quizConfig.totalQuestions, quizConfig.passingScore]
      );
      finalQuizId = insertResult.insertId;

      // Optionally link ALL available questions for the module to the master quiz pool in QuizQuestion
      // This is good for legacy compatibility and DB inspection
      try {
        const [poolQuestions] = await connection.execute(
          'SELECT bankId, difficulty, questionText FROM QuestionBank WHERE moduleId = ? LIMIT 100',
          [moduleId]
        );

        for (let i = 0; i < poolQuestions.length; i++) {
          await connection.execute(
            'INSERT INTO QuizQuestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, 1, ?)',
            [finalQuizId, poolQuestions[i].bankId, poolQuestions[i].questionText || 'Practice Question', 'medium', i + 1]
          );
        }
      } catch (poolErr) {
        console.warn('Failed to populate master quiz pool, but continuing...', poolErr);
      }
    }

    // 2. Pick a RANDOM subset of questions from the Master Quiz pool
    let sessionQuestions = [];
    try {
      [sessionQuestions] = await connection.execute(
        `SELECT questionId FROM QuizQuestion WHERE quizId = ? ORDER BY RAND() LIMIT ${parseInt(quizConfig.totalQuestions)}`,
        [finalQuizId]
      );
    } catch (poolQueryErr) {
      console.warn('Failed to query master quiz pool:', poolQueryErr);
    }

    if (sessionQuestions.length === 0) {
      // Fallback: If pool is empty, get anything from QuestionBank for this module
      // Now using the RESTORED moduleId column
      let legacyQuestions = [];
      try {
        [legacyQuestions] = await connection.execute(
          `SELECT bankId, questionText FROM QuestionBank WHERE moduleId = ? ORDER BY RAND() LIMIT ${parseInt(quizConfig.totalQuestions)}`,
          [moduleId]
        );
      } catch (qbErr) {
        console.warn('Failed to query QuestionBank by moduleId:', qbErr);
        // Deep fallback: just get some questions if moduleId filtered query failed
        [legacyQuestions] = await connection.execute(
          `SELECT bankId, questionText FROM QuestionBank ORDER BY RAND() LIMIT ${parseInt(quizConfig.totalQuestions)}`
        );
      }

      if (legacyQuestions.length === 0) {
        await connection.end();
        return res.status(404).json({
          success: false,
          message: 'No questions available for this practice quiz'
        });
      }

      // Re-populate pool
      for (let i = 0; i < legacyQuestions.length; i++) {
        await connection.execute(
          'INSERT INTO QuizQuestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, 1, ?)',
          [finalQuizId, legacyQuestions[i].bankId, legacyQuestions[i].questionText || 'Practice Question', 'medium', i + 1]
        );
      }

      // Re-query
      [sessionQuestions] = await connection.execute(
        `SELECT questionId FROM QuizQuestion WHERE quizId = ? ORDER BY RAND() LIMIT ${parseInt(quizConfig.totalQuestions)}`,
        [finalQuizId]
      );
    }

    const questionIds = sessionQuestions.map(q => q.questionId);

    // 3. Create the attempt and store the IDs in JSON
    const [attemptResult] = await connection.execute(
      'INSERT INTO QuizAttempt (studentId, quizId, startTime, status, submitAnswers) VALUES (?, ?, NOW(), "in_progress", ?)',
      [studentId, finalQuizId, JSON.stringify({ sessionQuestions: questionIds })]
    );

    await connection.end();

    return res.json({
      success: true,
      data: {
        attemptId: attemptResult.insertId,
        quizId: finalQuizId,
        timeLimit: quizConfig.timeLimit,
        totalQuestions: questionIds.length,
        passingScore: quizConfig.passingScore,
        isRandomSession: true
      }
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    if (connection) await connection.end();
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: error.message
    });
  }
};

// Start a timed exam
const startTimedExam = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const { timeLimit, questionCount, selectedModules } = req.body;
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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // For custom quizzes, use first selected module or first available module as moduleId
    let quizModuleId = null;
    if (selectedModules && selectedModules.length > 0) {
      quizModuleId = selectedModules[0];
    } else {
      // Get first available module
      const [firstModule] = await connection.execute('SELECT moduleId FROM Module LIMIT 1');
      quizModuleId = firstModule.length > 0 ? firstModule[0].moduleId : 1;
    }

    // Create a custom quiz for timed exam
    const [quizResult] = await connection.execute(
      'INSERT INTO Quiz (moduleId, timeLimit, totalQuestions, passingScore) VALUES (?, ?, ?, 60)',
      [quizModuleId, timeLimit, questionCount]
    );

    const quizId = quizResult.insertId;

    let questions = [];

    // Helper function to map difficulty to ENUM values
    const mapDifficulty = (difficulty) => {
      if (!difficulty) return 'medium';
      const lower = difficulty.toLowerCase();
      if (lower === 'easy' || lower === 'beginner') return 'easy';
      if (lower === 'hard' || lower === 'advanced' || lower === 'expert') return 'hard';
      return 'medium';
    };

    // Helper to get question text - use actual questionText if available
    const getQuestionText = (question) => {
      if (question.questionText) {
        return question.questionText;
      }
      return question.topic
        ? `What is related to ${question.topic}?`
        : 'Quiz Question';
    };

    // Select random questions (moduleId column doesn't exist in QuestionBank)
    // Try to get questionText if column exists
    // LIMIT cannot be parameterized, so we use template literal (safe after validation)
    const safeQuestionCount = parseInt(questionCount) || 20;
    let allQuestions;
    try {
      [allQuestions] = await connection.execute(
        `SELECT bankId, difficulty, topic, options, questionType, correctAnswer, explanation, questionText FROM QuestionBank ORDER BY RAND() LIMIT ${safeQuestionCount}`
      );
    } catch (e) {
      // If questionText column doesn't exist, select without it
      [allQuestions] = await connection.execute(
        `SELECT bankId, difficulty, topic, options, questionType, correctAnswer, explanation FROM QuestionBank ORDER BY RAND() LIMIT ${safeQuestionCount}`
      );
    }
    questions = allQuestions;

    if (questions.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'No questions available for the selected modules'
      });
    }

    // Insert questions into QuizQuestion
    for (let i = 0; i < questions.length; i++) {
      const mappedDifficulty = mapDifficulty(questions[i].difficulty);
      const questionText = getQuestionText(questions[i]);
      await connection.execute(
        'INSERT INTO QuizQuestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, 1, ?)',
        [quizId, questions[i].bankId, questionText, mappedDifficulty, i + 1]
      );
    }

    // Create quiz attempt
    const [attemptResult] = await connection.execute(
      'INSERT INTO QuizAttempt (studentId, quizId, startTime, status) VALUES (?, ?, NOW(), "in_progress")',
      [studentId, quizId]
    );

    const attemptId = attemptResult.insertId;

    await connection.end();

    res.json({
      success: true,
      data: {
        attemptId,
        quizId,
        timeLimit,
        totalQuestions: questions.length,
        passingScore: 60,
        questionsAssigned: questions.length
      }
    });

  } catch (error) {
    console.error('Error starting timed exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start timed exam',
      error: error.message
    });
  }
};

// Start an adaptive test
const startAdaptiveTest = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const { targetDifficulty, questionCount } = req.body;
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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // For adaptive test, use first available module as moduleId
    const [firstModule] = await connection.execute('SELECT moduleId FROM Module LIMIT 1');
    const quizModuleId = firstModule.length > 0 ? firstModule[0].moduleId : 1;

    // Create a custom quiz for adaptive test
    const [quizResult] = await connection.execute(
      'INSERT INTO Quiz (moduleId, timeLimit, totalQuestions, passingScore) VALUES (?, 45, ?, 70)',
      [quizModuleId, questionCount]
    );

    const quizId = quizResult.insertId;

    // Helper function to map difficulty to ENUM values
    const mapDifficulty = (difficulty) => {
      if (!difficulty) return 'medium';
      const lower = difficulty.toLowerCase();
      if (lower === 'easy' || lower === 'beginner') return 'easy';
      if (lower === 'hard' || lower === 'advanced' || lower === 'expert') return 'hard';
      return 'medium'; // default to medium for intermediate or any other value
    };

    // Map targetDifficulty to match QuestionBank difficulty values
    // QuestionBank might use 'beginner', 'intermediate', 'advanced' while QuizQuestion uses 'easy', 'medium', 'hard'
    let searchDifficulty = targetDifficulty;
    if (targetDifficulty === 'easy' || targetDifficulty === 'beginner') {
      searchDifficulty = 'easy';
    } else if (targetDifficulty === 'hard' || targetDifficulty === 'advanced') {
      searchDifficulty = 'hard';
    } else {
      searchDifficulty = 'medium'; // intermediate or medium
    }

    // Helper to get question text - use actual questionText if available
    const getQuestionText = (question) => {
      if (question.questionText) {
        return question.questionText;
      }
      return question.topic
        ? `What is related to ${question.topic}?`
        : 'Quiz Question';
    };

    // Select questions based on difficulty
    // Try to get questionText if column exists
    // LIMIT cannot be parameterized, so we use template literal (safe after validation)
    const safeQuestionCount = parseInt(questionCount) || 18;
    let questions;
    try {
      [questions] = await connection.execute(
        `SELECT bankId, difficulty, topic, options, questionType, correctAnswer, explanation, questionText FROM QuestionBank WHERE difficulty = ? OR difficulty = ? ORDER BY RAND() LIMIT ${safeQuestionCount}`,
        [targetDifficulty, searchDifficulty]
      );
    } catch (e) {
      // If questionText column doesn't exist, select without it
      [questions] = await connection.execute(
        `SELECT bankId, difficulty, topic, options, questionType, correctAnswer, explanation FROM QuestionBank WHERE difficulty = ? OR difficulty = ? ORDER BY RAND() LIMIT ${safeQuestionCount}`,
        [targetDifficulty, searchDifficulty]
      );
    }

    if (questions.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'No questions available for the selected difficulty level'
      });
    }

    // Insert questions into QuizQuestion
    for (let i = 0; i < questions.length; i++) {
      const mappedDifficulty = mapDifficulty(questions[i].difficulty);
      const questionText = getQuestionText(questions[i]);
      await connection.execute(
        'INSERT INTO QuizQuestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, 1, ?)',
        [quizId, questions[i].bankId, questionText, mappedDifficulty, i + 1]
      );
    }

    // Create quiz attempt
    const [attemptResult] = await connection.execute(
      'INSERT INTO QuizAttempt (studentId, quizId, startTime, status) VALUES (?, ?, NOW(), "in_progress")',
      [studentId, quizId]
    );

    const attemptId = attemptResult.insertId;

    await connection.end();

    res.json({
      success: true,
      data: {
        attemptId,
        quizId,
        timeLimit: 45,
        totalQuestions: questionCount,
        passingScore: 70
      }
    });

  } catch (error) {
    console.error('Error starting adaptive test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start adaptive test',
      error: error.message
    });
  }
};

// Get previous quiz attempts
const getQuizAttempts = async (req, res) => {
  try {
    const userId = req.session.user.userId;
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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Get quiz attempts with details
    const [attempts] = await connection.execute(`
      SELECT
        qa.attemptId,
        qa.startTime,
        qa.endTime,
        qa.status,
        qa.getScore,
        qa.quizId,
        COALESCE(q.title, m.title, 'Practice Session') as quizTitle,
        m.title as moduleTitle,
        q.timeLimit,
        q.totalQuestions,
        q.isCustom,
        COALESCE(q.passingScore, 60) as passingScore
      FROM QuizAttempt qa
      LEFT JOIN Quiz q ON qa.quizId = q.quizId
      LEFT JOIN Module m ON (q.moduleId = m.moduleId OR qa.quizId IS NULL)
      WHERE qa.studentId = ?
      ORDER BY qa.startTime DESC
    `, [studentId]);

    await connection.end();

    // Transform data to match frontend interface with defensive defaults
    const transformedAttempts = attempts.map(attempt => {
      const start = attempt.startTime ? new Date(attempt.startTime) : null;
      const end = attempt.endTime ? new Date(attempt.endTime) : null;

      const durationMs = end && start ? end.getTime() - start.getTime() : 0;
      const durationMins = Math.floor(durationMs / (1000 * 60));
      const durationSecs = Math.floor((durationMs % (1000 * 60)) / 1000);
      const timeStr = durationMs > 0
        ? (durationMins >= 60
          ? `${Math.floor(durationMins / 60)}:${String(durationMins % 60).padStart(2, '0')}:${String(durationSecs).padStart(2, '0')}`
          : `${durationMins}:${String(durationSecs).padStart(2, '0')}`)
        : '0:00';

      const score = typeof attempt.getScore === 'number' ? attempt.getScore : (attempt.getScore ? parseFloat(attempt.getScore) : 0);

      return {
        attemptId: attempt.attemptId,
        quizId: attempt.quizId,
        date: start ? start.toLocaleDateString() : 'N/A',
        type: attempt.isCustom ? 'Assessment' : 'Practice',
        module: attempt.quizTitle || attempt.moduleTitle || 'General Practice',
        score: score,
        time: timeStr,
        status: attempt.status === 'completed'
          ? (score >= (attempt.passingScore || 60) ? 'passed' : 'failed')
          : (attempt.status || 'in_progress')
      };
    });

    res.json({
      success: true,
      data: transformedAttempts
    });

  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts',
      error: error.message
    });
  }
};

// Submit an answer for a specific question in a quiz attempt
const submitAnswer = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    // Handle both route formats: /attempt/:attemptId/answer and /submit-answer
    const attemptId = req.params.attemptId || req.body.attemptId;
    const { questionId, answer, timeSpent } = req.body;

    if (!attemptId || !questionId) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID and Question ID are required'
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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Verify the attempt belongs to the student and is still in progress
    const [attempts] = await connection.execute(
      'SELECT qa.attemptId, qa.status, qq.questionId, qb.correctAnswer, qq.points FROM QuizAttempt qa JOIN QuizQuestion qq ON qa.quizId = qq.quizId JOIN QuestionBank qb ON qq.bankId = qb.bankId WHERE qa.attemptId = ? AND qa.studentId = ? AND qq.questionId = ?',
      [attemptId, studentId, questionId]
    );

    if (attempts.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt or question not found'
      });
    }

    const attempt = attempts[0];

    if (attempt.status !== 'in_progress') {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Quiz attempt is no longer in progress'
      });
    }

    // Check if answer is correct (handle string comparison, case-insensitive, trim whitespace)
    const normalizedAnswer = String(answer || '').trim();
    const normalizedCorrect = String(attempt.correctAnswer || '').trim();
    const isCorrect = normalizedAnswer.toLowerCase() === normalizedCorrect.toLowerCase();
    const pointsEarned = isCorrect ? (attempt.points || 1) : 0;

    // Insert or update answer record
    await connection.execute(
      'INSERT INTO AnswerRecord (attemptId, questionId, studentAnswer, isCorrect, pointsEarned, timeSpent, recordAnswer, validate) VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE) ON DUPLICATE KEY UPDATE studentAnswer = VALUES(studentAnswer), isCorrect = VALUES(isCorrect), pointsEarned = VALUES(pointsEarned), timeSpent = VALUES(timeSpent)',
      [attemptId, questionId, answer, isCorrect, pointsEarned, timeSpent || 0]
    );

    await connection.end();

    res.json({
      success: true,
      data: {
        isCorrect,
        pointsEarned,
        correctAnswer: attempt.correctAnswer
      }
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

// Get quiz progress for a specific attempt
const getQuizProgress = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const { attemptId } = req.params;

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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Get attempt details and progress
    const [attempts] = await connection.execute(`
      SELECT
        qa.attemptId,
        qa.startTime,
        qa.status,
        qa.submitAnswers,
        q.quizId,
        q.timeLimit,
        q.totalQuestions,
        COUNT(ar.recordId) as answeredQuestions,
        SUM(ar.pointsEarned) as totalPointsEarned,
        SUM(ar.timeSpent) as totalTimeSpent
      FROM QuizAttempt qa
      JOIN Quiz q ON qa.quizId = q.quizId
      LEFT JOIN AnswerRecord ar ON qa.attemptId = ar.attemptId
      WHERE qa.attemptId = ? AND qa.studentId = ?
      GROUP BY qa.attemptId, qa.startTime, qa.status, qa.submitAnswers, q.quizId, q.timeLimit, q.totalQuestions
    `, [attemptId, studentId]);

    if (attempts.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    const attempt = attempts[0];

    // Parse session questions from attempt metadata if they exist
    let sessionQuestions = null;
    try {
      const metadata = attempt.submitAnswers ? (typeof attempt.submitAnswers === 'string' ? JSON.parse(attempt.submitAnswers) : attempt.submitAnswers) : {};
      if (metadata.sessionQuestions && Array.isArray(metadata.sessionQuestions)) {
        sessionQuestions = metadata.sessionQuestions;
      }
    } catch (e) {
      console.warn('Failed to parse attempt metadata:', e);
    }

    // Get question statuses
    let questionStatuses;
    if (sessionQuestions && sessionQuestions.length > 0) {
      // For Dynamic Practice Sessions, only return the questions picked for this session
      [questionStatuses] = await connection.execute(`
        SELECT
          qq.questionId,
          qq.displayOrder,
          CASE WHEN ar.recordId IS NOT NULL THEN TRUE ELSE FALSE END as isAnswered,
          ar.isCorrect,
          ar.pointsEarned,
          ar.timeSpent
        FROM QuizQuestion qq
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND ar.attemptId = ?
        WHERE qq.questionId IN (${sessionQuestions.map(id => parseInt(id)).join(',')})
        ORDER BY FIELD(qq.questionId, ${sessionQuestions.map(id => parseInt(id)).join(',')})
      `, [attemptId]);
    } else {
      // Original logic for static faculty quizzes
      [questionStatuses] = await connection.execute(`
        SELECT
          qq.questionId,
          qq.displayOrder,
          CASE WHEN ar.recordId IS NOT NULL THEN TRUE ELSE FALSE END as isAnswered,
          ar.isCorrect,
          ar.pointsEarned,
          ar.timeSpent
        FROM QuizQuestion qq
        JOIN Quiz q ON qq.quizId = q.quizId
        JOIN QuizAttempt qa ON q.quizId = qa.quizId
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND qa.attemptId = ar.attemptId
        WHERE qa.attemptId = ?
        ORDER BY qq.displayOrder ASC
      `, [attemptId]);
    }

    await connection.end();

    const progress = {
      attemptId: attempt.attemptId,
      status: attempt.status,
      startTime: attempt.startTime,
      timeLimit: attempt.timeLimit,
      totalQuestions: attempt.totalQuestions,
      answeredQuestions: attempt.answeredQuestions || 0,
      totalPointsEarned: attempt.totalPointsEarned || 0,
      totalTimeSpent: attempt.totalTimeSpent || 0,
      progressPercentage: Math.round(((attempt.answeredQuestions || 0) / attempt.totalQuestions) * 100),
      questions: questionStatuses.map(q => ({
        questionId: q.questionId,
        displayOrder: q.displayOrder,
        isAnswered: q.isAnswered,
        isCorrect: q.isCorrect,
        pointsEarned: q.pointsEarned || 0,
        timeSpent: q.timeSpent || 0
      }))
    };

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Error fetching quiz progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz progress',
      error: error.message
    });
  }
};

// Finish a quiz attempt
const finishQuiz = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const { attemptId } = req.params;

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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Get attempt details
    const [attempts] = await connection.execute(`
      SELECT
        qa.attemptId,
        qa.status,
        qa.submitAnswers,
        qa.startTime,
        q.quizId,
        q.passingScore,
        q.totalQuestions
      FROM QuizAttempt qa
      JOIN Quiz q ON qa.quizId = q.quizId
      WHERE qa.attemptId = ? AND qa.studentId = ?
    `, [attemptId, studentId]);

    if (attempts.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    const attempt = attempts[0];

    if (attempt.status !== 'in_progress') {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Quiz attempt is not in progress'
      });
    }

    // Parse session questions from attempt metadata if they exist
    let sessionQuestions = null;
    try {
      const metadata = attempt.submitAnswers ? (typeof attempt.submitAnswers === 'string' ? JSON.parse(attempt.submitAnswers) : attempt.submitAnswers) : {};
      if (metadata.sessionQuestions && Array.isArray(metadata.sessionQuestions)) {
        sessionQuestions = metadata.sessionQuestions;
      }
    } catch (e) {
      console.warn('Failed to parse attempt metadata:', e);
    }

    // Calculate score based on either subset or full quiz
    let stats;
    let questionDetails;

    if (sessionQuestions && sessionQuestions.length > 0) {
      // Subset Logic: Only count questions picked for this session
      const qIdsStr = sessionQuestions.map(id => parseInt(id)).join(',');

      const [subsetStats] = await connection.execute(`
        SELECT
          COUNT(ar.recordId) as answeredQuestions,
          SUM(ar.pointsEarned) as totalPointsEarned,
          (SELECT SUM(points) FROM QuizQuestion WHERE questionId IN (${qIdsStr})) as totalPossiblePoints
        FROM QuizQuestion qq
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND ar.attemptId = ?
        WHERE qq.questionId IN (${qIdsStr})
      `, [attemptId]);

      stats = subsetStats[0];
      stats.totalQuestions = sessionQuestions.length;

      // Get detailed results for subset
      [questionDetails] = await connection.execute(`
        SELECT
          qq.questionId,
          qq.questionText,
          qq.difficulty,
          qb.questionType,
          qb.options,
          qb.correctAnswer,
          qb.explanation,
          ar.studentAnswer,
          ar.isCorrect,
          ar.pointsEarned,
          ar.timeSpent
        FROM QuizQuestion qq
        JOIN QuestionBank qb ON qq.bankId = qb.bankId
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND ar.attemptId = ?
        WHERE qq.questionId IN (${qIdsStr})
        ORDER BY FIELD(qq.questionId, ${qIdsStr})
      `, [attemptId]);
    } else {
      // Full Quiz Logic (Faculty Assessments)
      const [fullStats] = await connection.execute(`
        SELECT
          COUNT(ar.recordId) as answeredQuestions,
          SUM(ar.pointsEarned) as totalPointsEarned,
          (SELECT SUM(points) FROM QuizQuestion WHERE quizId = ?) as totalPossiblePoints
        FROM QuizQuestion qq
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND ar.attemptId = ?
        WHERE qq.quizId = ?
      `, [attempt.quizId, attemptId, attempt.quizId]);

      stats = fullStats[0];
      stats.totalQuestions = attempt.totalQuestions;

      // Get detailed results for full quiz
      [questionDetails] = await connection.execute(`
        SELECT
          qq.questionId,
          qq.questionText,
          qq.displayOrder,
          qq.difficulty,
          qb.questionType,
          qb.options,
          qb.correctAnswer,
          qb.explanation,
          ar.studentAnswer,
          ar.isCorrect,
          ar.pointsEarned,
          ar.timeSpent
        FROM QuizQuestion qq
        JOIN QuestionBank qb ON qq.bankId = qb.bankId
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND ar.attemptId = ?
        WHERE qq.quizId = ?
        ORDER BY qq.displayOrder ASC
      `, [attemptId, attempt.quizId]);
    }

    // Calculate final score
    const totalPossiblePoints = stats.totalPossiblePoints || stats.totalQuestions;
    const totalPointsEarned = stats.totalPointsEarned || 0;
    const score = totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0;
    const passed = score >= (attempt.passingScore || 60);
    const answeredQuestions = stats.answeredQuestions || 0;
    const totalQuestions = stats.totalQuestions;

    // Fixed correctAnswers calculation: count records where isCorrect is 1
    const [correctCountRes] = await connection.execute(
      'SELECT COUNT(*) as correctCount FROM AnswerRecord WHERE attemptId = ? AND isCorrect = 1',
      [attemptId]
    );
    const correctAnswers = correctCountRes[0].correctCount;
    const incorrectAnswers = Math.max(0, answeredQuestions - correctAnswers);
    const skippedQuestions = Math.max(0, totalQuestions - answeredQuestions);

    // Get module title
    const [moduleInfo] = await connection.execute(`
      SELECT m.title as moduleTitle
      FROM Quiz q
      LEFT JOIN Module m ON q.moduleId = m.moduleId
      WHERE q.quizId = ?
    `, [attempt.quizId]);

    const moduleTitle = moduleInfo.length > 0 ? moduleInfo[0].moduleTitle : 'Quiz';

    // Update attempt with final results
    await connection.execute(
      'UPDATE QuizAttempt SET status = "completed", endTime = NOW(), submitAnswers = ?, finishAt = NOW(), getScore = ? WHERE attemptId = ?',
      [JSON.stringify({ answeredQuestions, totalPointsEarned, totalQuestions, correctAnswers, incorrectAnswers, skippedQuestions }), score, attemptId]
    );

    // Format questions for frontend
    const mapQuestionType = (questionType) => {
      if (!questionType) return 'MCQ';
      const type = questionType.toLowerCase();
      if (type === 'multiple_choice') return 'MCQ';
      if (type === 'labeling') return 'Labeling';
      if (type === 'drag_drop') return 'Drag & Drop';
      return 'MCQ';
    };

    const detailedQuestions = questionDetails.map(q => ({
      id: q.questionId,
      question: q.questionText || 'Question text not available',
      yourAnswer: q.studentAnswer || 'Not answered',
      correctAnswer: q.correctAnswer || 'N/A',
      isCorrect: q.isCorrect === 1 || q.isCorrect === true,
      type: mapQuestionType(q.questionType),
      explanation: q.explanation || 'No explanation available',
      pointsEarned: q.pointsEarned || 0,
      timeSpent: q.timeSpent || 0
    }));

    // Calculate question breakdown by type
    const questionBreakdown = detailedQuestions.reduce((acc, q) => {
      const type = q.type;
      if (!acc[type]) {
        acc[type] = { type, total: 0, correct: 0 };
      }
      acc[type].total++;
      if (q.isCorrect) {
        acc[type].correct++;
      }
      return acc;
    }, {});

    await connection.end();

    // Format time spent (MM:SS to match quiz timer display)
    const timeSpentMs = attempt.startTime ? (Date.now() - new Date(attempt.startTime).getTime()) : 0;
    const timeSpentSeconds = Math.floor(timeSpentMs / 1000);
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeSpentFormatted = mins >= 60
      ? `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${mins}:${String(secs).padStart(2, '0')}`;

    res.json({
      success: true,
      data: {
        attemptId,
        score,
        passingScore: attempt.passingScore || 60,
        passed,
        totalQuestions: totalQuestions,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        answeredQuestions: answeredQuestions,
        totalPointsEarned,
        totalPossiblePoints,
        timeSpent: timeSpentFormatted,
        timeTaken: timeSpentSeconds,
        attemptDate: new Date().toLocaleString(),
        quizTitle: moduleTitle,
        module: moduleTitle,
        questionBreakdown: Object.values(questionBreakdown),
        detailedQuestions
      }
    });

  } catch (error) {
    console.error('Error finishing quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finish quiz',
      error: error.message
    });
  }
};

// Get details of a specific quiz attempt
const getQuizAttempt = async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const { attemptId } = req.params;

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
        message: 'Student not found'
      });
    }

    const studentId = students[0].studentId;

    // Get attempt details
    const [attempts] = await connection.execute(`
      SELECT
        qa.attemptId,
        qa.startTime,
        qa.endTime,
        qa.status,
        qa.getScore,
        qa.submitAnswers,
        q.quizId,
        q.timeLimit,
        q.totalQuestions,
        q.passingScore,
        m.title as moduleTitle,
        m.moduleId
      FROM QuizAttempt qa
      JOIN Quiz q ON qa.quizId = q.quizId
      LEFT JOIN Module m ON q.moduleId = m.moduleId
      WHERE qa.attemptId = ? AND qa.studentId = ?
    `, [attemptId, studentId]);

    if (attempts.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    const attempt = attempts[0];

    // Parse session questions from attempt metadata if they exist
    let sessionQuestions = null;
    try {
      const metadata = attempt.submitAnswers ? (typeof attempt.submitAnswers === 'string' ? JSON.parse(attempt.submitAnswers) : attempt.submitAnswers) : {};
      if (metadata.sessionQuestions && Array.isArray(metadata.sessionQuestions)) {
        sessionQuestions = metadata.sessionQuestions;
      }
    } catch (e) {
      console.warn('Failed to parse attempt metadata:', e);
    }

    // Get questions and answers
    let questions;
    if (sessionQuestions && sessionQuestions.length > 0) {
      [questions] = await connection.execute(`
        SELECT
          qq.questionId,
          qq.questionText,
          qq.difficulty,
          qq.points,
          qb.questionType,
          qb.options,
          qb.correctAnswer,
          qb.explanation,
          ar.studentAnswer,
          ar.isCorrect,
          ar.pointsEarned,
          ar.timeSpent
        FROM QuizQuestion qq
        JOIN QuestionBank qb ON qq.bankId = qb.bankId
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND ar.attemptId = ?
        WHERE qq.questionId IN (${sessionQuestions.map(id => parseInt(id)).join(',')})
        ORDER BY FIELD(qq.questionId, ${sessionQuestions.map(id => parseInt(id)).join(',')})
      `, [attemptId]);
    } else {
      // Original logic for static faculty quizzes
      [questions] = await connection.execute(`
        SELECT
          qq.questionId,
          qq.questionText,
          qq.difficulty,
          qq.points,
          qb.questionType,
          qb.options,
          qb.correctAnswer,
          qb.explanation,
          ar.studentAnswer,
          ar.isCorrect,
          ar.pointsEarned,
          ar.timeSpent
        FROM QuizQuestion qq
        JOIN QuestionBank qb ON qq.bankId = qb.bankId
        JOIN Quiz q ON qq.quizId = q.quizId
        JOIN QuizAttempt qa ON q.quizId = qa.quizId
        LEFT JOIN AnswerRecord ar ON qq.questionId = ar.questionId AND qa.attemptId = ar.attemptId
        WHERE qa.attemptId = ?
        ORDER BY qq.displayOrder ASC
      `, [attemptId]);
    }

    await connection.end();

    // Map questionType to frontend format
    const mapQuestionType = (questionType) => {
      if (!questionType) return 'mcq';
      const type = questionType.toLowerCase();
      if (type === 'multiple_choice') return 'mcq';
      if (type === 'labeling') return 'labeling';
      if (type === 'drag_drop') return 'drag-drop';
      return 'mcq'; // default
    };

    // Format questions for frontend
    const formattedQuestions = questions.map(q => {
      const parsedOptions = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
      const questionType = mapQuestionType(q.questionType);

      const baseQuestion = {
        id: q.questionId,
        question: q.questionText || 'Question text not available',
        type: questionType,
        difficulty: q.difficulty,
        points: q.points,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        studentAnswer: q.studentAnswer,
        isCorrect: q.isCorrect,
        hint: q.explanation || 'No hint available'
      };

      // Add type-specific fields
      if (questionType === 'mcq' && Array.isArray(parsedOptions)) {
        baseQuestion.options = parsedOptions;
      } else if (questionType === 'labeling') {
        // For labeling questions, create mock hotspots and labels from options
        baseQuestion.hotspots = parsedOptions.slice(0, 5).map((opt, idx) => ({
          id: `spot-${idx}`,
          x: 20 + (idx * 15),
          y: 30 + (idx % 2 * 20)
        }));
        baseQuestion.labels = Array.isArray(parsedOptions) ? parsedOptions : [];
      } else if (questionType === 'drag-drop') {
        // For drag-drop, create drop zones and items from options
        baseQuestion.dropZones = [
          { id: 'zone-1', description: 'Drop answer here' },
          { id: 'zone-2', description: 'Drop answer here' }
        ];
        baseQuestion.items = Array.isArray(parsedOptions)
          ? parsedOptions.map((opt, idx) => ({ id: `item-${idx}`, text: opt }))
          : [];
      }

      return baseQuestion;
    });

    // Calculate results if quiz is completed
    let resultsData = null;
    if (attempt.status === 'completed' && attempt.getScore !== null) {
      // Calculate correct/incorrect answers
      const correctAnswers = formattedQuestions.filter(q => q.isCorrect === 1 || q.isCorrect === true).length;
      const incorrectAnswers = formattedQuestions.filter(q => q.studentAnswer && (q.isCorrect === 0 || q.isCorrect === false)).length;
      const skippedQuestions = formattedQuestions.filter(q => !q.studentAnswer).length;

      // Calculate question breakdown by type
      const questionBreakdown = formattedQuestions.reduce((acc, q) => {
        const type = q.type === 'mcq' ? 'MCQ' : q.type === 'labeling' ? 'Labeling' : q.type === 'drag-drop' ? 'Drag & Drop' : 'MCQ';
        if (!acc[type]) {
          acc[type] = { type, total: 0, correct: 0 };
        }
        acc[type].total++;
        if (q.isCorrect === 1 || q.isCorrect === true) {
          acc[type].correct++;
        }
        return acc;
      }, {});

      // Format time spent (MM:SS to match quiz timer display)
      const timeSpentMs = attempt.endTime && attempt.startTime
        ? new Date(attempt.endTime) - new Date(attempt.startTime)
        : 0;
      const timeSpentSeconds = Math.floor(timeSpentMs / 1000);
      const mins = Math.floor(timeSpentSeconds / 60);
      const secs = timeSpentSeconds % 60;
      const timeSpentFormatted = mins >= 60
        ? `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${mins}:${String(secs).padStart(2, '0')}`;

      // Format detailed questions for results
      const detailedQuestions = formattedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        yourAnswer: q.studentAnswer || 'Not answered',
        correctAnswer: q.correctAnswer || 'N/A',
        isCorrect: q.isCorrect === 1 || q.isCorrect === true,
        type: q.type === 'mcq' ? 'MCQ' : q.type === 'labeling' ? 'Labeling' : q.type === 'drag-drop' ? 'Drag & Drop' : 'MCQ',
        explanation: q.explanation || 'No explanation available'
      }));

      const currentScore = typeof attempt.getScore === 'number' ? attempt.getScore : parseFloat(attempt.getScore || 0);
      const passThreshold = typeof attempt.passingScore === 'number' ? attempt.passingScore : parseFloat(attempt.passingScore || 60);

      resultsData = {
        score: currentScore,
        passingScore: passThreshold,
        passed: currentScore >= passThreshold,
        correctAnswers,
        incorrectAnswers,
        skippedQuestions,
        timeSpent: timeSpentFormatted,
        timeTaken: timeSpentSeconds,
        attemptDate: attempt.endTime ? new Date(attempt.endTime).toLocaleString() : new Date().toLocaleString(),
        questionBreakdown: Object.values(questionBreakdown),
        detailedQuestions
      };
    }

    const attemptDetails = {
      attemptId: attempt.attemptId,
      title: attempt.moduleTitle || 'Quiz',
      module: attempt.moduleTitle || 'Module',
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      status: attempt.status,
      score: attempt.getScore,
      timeLimit: attempt.timeLimit,
      totalQuestions: attempt.totalQuestions,
      passingScore: attempt.passingScore,
      moduleTitle: attempt.moduleTitle,
      moduleId: attempt.moduleId,
      questions: formattedQuestions,
      results: resultsData // Include results if completed
    };

    res.json({
      success: true,
      data: attemptDetails
    });

  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempt',
      error: error.message
    });
  }
};

// Create a new customized quiz (faculty feature)
const createQuiz = async (req, res) => {
  let connection = null;
  try {
    const { title, description, moduleId, questions, timeLimit, passingScore } = req.body;

    if (!title || !moduleId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, moduleId, and questions are required.'
      });
    }

    connection = await db();
    await connection.beginTransaction();

    // 1. Create the Quiz entry
    const [quizResult] = await connection.execute(
      'INSERT INTO Quiz (title, description, moduleId, timeLimit, totalQuestions, passingScore, isCustom) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      [title, description || '', moduleId, timeLimit || 30, questions.length, passingScore || 60]
    );

    const quizId = quizResult.insertId;

    // 2. Insert questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // We need a bankId. For manual entry, we might need to create QuestionBank entries first 
      // or allow QuizQuestion to hold the data directly if the schema allows.
      // Based on dbtables.sql, QuizQuestion has questionText but relies on bankId for options/correctAnswer.
      // Let's create a QuestionBank entry for each question if it's a new manual one.

      // Validation: convert undefined to null for DB
      const questionType = q.type === 'mcq' ? 'multiple_choice' : q.type === 'short' ? 'short_answer' : 'short_answer';
      const difficulty = 'medium';
      const topic = title ? title.substring(0, 100) : '';
      const questionText = q.question ?? null;
      // If correctAnswer is undefined but correctIndex and options exist, set correctAnswer
      let correctAnswer = q.correctAnswer;
      if (correctAnswer === undefined && Array.isArray(q.options) && typeof q.correctIndex === 'number') {
        correctAnswer = q.options[q.correctIndex] ?? null;
      }
      if (correctAnswer === undefined) correctAnswer = null;
      const options = q.options ? JSON.stringify(q.options) : null;
      const moduleIdVal = moduleId ?? null;
      const points = q.points !== undefined ? q.points : 1;

      const [bankResult] = await connection.execute(
        'INSERT INTO QuestionBank (questionType, difficulty, topic, questionText, correctAnswer, options, moduleId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          questionType,
          difficulty,
          topic,
          questionText,
          correctAnswer,
          options,
          moduleIdVal
        ]
      );

      const bankId = bankResult.insertId;

      await connection.execute(
        'INSERT INTO QuizQuestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
        [
          quizId,
          bankId,
          questionText,
          difficulty,
          points,
          i + 1
        ]
      );
    }

    await connection.commit();
    await connection.end();

    res.status(201).json({
      success: true,
      data: { quizId },
      message: 'Quiz created successfully'
    });

  } catch (error) {
    console.error('CRITICAL ERROR creating quiz:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      stack: error.stack
    });
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
};

// Get questions for a specific quiz (for instructor preview)
const getQuizQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const connection = await db();

    const [questions] = await connection.execute(
      `SELECT qq.questionId, qq.questionText, qq.difficulty, qq.points, qq.displayOrder,
              qb.options, qb.correctAnswer
       FROM quizquestion qq
       LEFT JOIN questionbank qb ON qq.bankId = qb.bankId
       WHERE qq.quizId = ?
       ORDER BY qq.displayOrder ASC`,
      [quizId]
    );

    await connection.end();
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz questions', error: error.message });
  }
};

// Get custom quizzes for a module
const getCustomQuizzesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const connection = await db();

    const [quizzes] = await connection.execute(
      'SELECT quizId, title, description, totalQuestions, timeLimit, passingScore, generatedAt FROM Quiz WHERE moduleId = ? AND isCustom = TRUE ORDER BY generatedAt DESC',
      [moduleId]
    );

    await connection.end();

    res.json({
      success: true,
      data: quizzes
    });

  } catch (error) {
    console.error('Error fetching custom quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom quizzes',
      error: error.message
    });
  }
};

module.exports = {
  getQuizModules,
  getQuizStats,
  startModuleQuiz,
  startTimedExam,
  startAdaptiveTest,
  getQuizAttempts,
  submitAnswer,
  getQuizProgress,
  finishQuiz,
  getQuizAttempt,
  createQuiz,
  getCustomQuizzesByModule,
  getQuizQuestions
};
