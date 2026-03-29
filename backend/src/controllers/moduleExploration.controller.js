const db = require('../config/db');

// Get module details including sections and anatomy parts
const getModuleDetails = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;

    const connection = await db();

    // Get module info
    const [modules] = await connection.execute(
      'SELECT m.moduleId, m.title, m.description, m.difficultyLevel, m.createdAt FROM Module m WHERE m.moduleId = ?',
      [moduleId]
    );

    if (modules.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const module = modules[0];

    // Get anatomy system for this module (assuming cardiovascular for now)
    const [systems] = await connection.execute(
      'SELECT systemId, systemName FROM AnatomySystem WHERE systemName LIKE "%Cardiovascular%" LIMIT 1'
    );

    const systemId = systems.length > 0 ? systems[0].systemId : null;

    // Get anatomy models for this system
    const [models] = await connection.execute(
      'SELECT modelId, modelName, thumbnailPath FROM AnatomyModel WHERE systemId = ? AND render3D = TRUE',
      [systemId]
    );

    // Get anatomy parts (hardcoded for now, should come from database)
    const anatomyParts = [
      { id: 1, name: 'Right Atrium', description: 'Upper right chamber of the heart that receives deoxygenated blood from the body', related: ['Superior Vena Cava', 'Inferior Vena Cava', 'Tricuspid Valve'] },
      { id: 2, name: 'Left Ventricle', description: 'Main pumping chamber that sends oxygenated blood to the body', related: ['Aortic Valve', 'Mitral Valve', 'Aorta'] },
      { id: 3, name: 'Aortic Valve', description: 'Controls blood flow from left ventricle to aorta', related: ['Left Ventricle', 'Aorta'] },
      { id: 4, name: 'Pulmonary Artery', description: 'Carries deoxygenated blood from heart to lungs', related: ['Right Ventricle', 'Pulmonary Valve'] }
    ];

    // Get sections (hardcoded for now)
    const sections = [
      { id: 1, name: 'Overview', parts: 4 },
      { id: 2, name: 'Heart Chambers', parts: 4 },
      { id: 3, name: 'Valves', parts: 4 },
      { id: 4, name: 'Blood Vessels', parts: 6 },
      { id: 5, name: 'Electrical System', parts: 3 }
    ];

    await connection.end();

    res.json({
      success: true,
      data: {
        module: {
          moduleId: module.moduleId,
          name: module.title,
          description: module.description,
          difficulty: module.difficultyLevel,
          createdAt: module.createdAt
        },
        anatomyParts,
        sections,
        models
      }
    });

  } catch (error) {
    console.error('Error fetching module details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch module details',
      error: error.message
    });
  }
};

// Get saved bookmarks/views for the module
const getBookmarks = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;

    const connection = await db();

    // For now, return hardcoded bookmarks. In future, store in database
    const bookmarks = [
      { name: 'Anterior View', rotation: { x: 0, y: 0 } },
      { name: 'Posterior View', rotation: { x: 0, y: 180 } },
      { name: 'Lateral View', rotation: { x: 0, y: 90 } }
    ];

    await connection.end();

    res.json({
      success: true,
      data: bookmarks
    });

  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks',
      error: error.message
    });
  }
};

// Save a bookmark
const saveBookmark = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;
    const { name, rotation } = req.body;

    // For now, just return success. In future, save to database
    res.json({
      success: true,
      message: 'Bookmark saved successfully'
    });

  } catch (error) {
    console.error('Error saving bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save bookmark',
      error: error.message
    });
  }
};

// Get saved notes for the module
const getNotes = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;

    const connection = await db();

    // For now, return empty notes. In future, store in database
    const notes = '';

    await connection.end();

    res.json({
      success: true,
      data: notes
    });

  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
};

// Save notes for the module
const saveNotes = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;
    const { notes } = req.body;

    // For now, just return success. In future, save to database
    res.json({
      success: true,
      message: 'Notes saved successfully'
    });

  } catch (error) {
    console.error('Error saving notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save notes',
      error: error.message
    });
  }
};

// Log model interaction
const logInteraction = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;
    const { interactionType, durationSeconds, metadata } = req.body;

    const connection = await db();

    // Get or create learning session
    const [sessions] = await connection.execute(
      'SELECT sessionId FROM LearningSession WHERE studentId = ? AND moduleId = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1',
      [studentId, moduleId]
    );

    let sessionId;
    if (sessions.length > 0) {
      sessionId = sessions[0].sessionId;
    } else {
      // Create new session
      const [result] = await connection.execute(
        'INSERT INTO LearningSession (studentId, moduleId, startTime, sessionType) VALUES (?, ?, NOW(), "study")',
        [studentId, moduleId]
      );
      sessionId = result.insertId;
    }

    // Log interaction
    await connection.execute(
      'INSERT INTO ModelInteraction (sessionId, interactionType, timestamp, durationSeconds, metadata, record) VALUES (?, ?, NOW(), ?, ?, TRUE)',
      [sessionId, interactionType, durationSeconds || 0, JSON.stringify(metadata || {})]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Interaction logged successfully'
    });

  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log interaction',
      error: error.message
    });
  }
};

// RAG Server URL 
const RAG_SERVER_URL = process.env.RAG_SERVER_URL || 'http://localhost:8000';

// AI Chat endpoint - integrated with RAG server
const chatWithAI = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    let response = '';
    let citations = [];
    let questionType = 'general';
    let confidence = 0.8;

    try {
      // Call RAG server
      const ragResponse = await fetch(`${RAG_SERVER_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: question, k: 6, use_llm: true }),
        signal: AbortSignal.timeout(120000)
      });

      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        response = ragData.answer || '';
        citations = ragData.citations || [];
        questionType = ragData.question_type || 'general';
        confidence = 0.9;
      } else {
        response = 'The AI service is temporarily unavailable. Please try again in a moment.';
        confidence = 0;
      }
    } catch (ragError) {
      console.error('RAG server error:', ragError.message);
      response = 'The AI assistant is currently offline. Please ensure the RAG server is running and try again.';
      confidence = 0;
    }

    // Log chat to database
    const connection = await db();
    await connection.execute(
      'INSERT INTO AIChat (studentId, moduleId, question, response, timestamp, sentiment, optResponse, rateResponse) VALUES (?, ?, ?, ?, NOW(), "neutral", ?, ?)',
      [studentId, moduleId, question, response, JSON.stringify({ response, citations, questionType }), confidence]
    );
    await connection.end();

    res.json({
      success: true,
      data: {
        response,
        citations,
        questionType,
        confidence
      }
    });

  } catch (error) {
    console.error('Error processing AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat request',
      error: error.message
    });
  }
};

// Get chat history for a module
const getChatHistory = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;

    const connection = await db();
    const [chats] = await connection.execute(
      'SELECT question, response, timestamp FROM AIChat WHERE studentId = ? AND moduleId = ? ORDER BY timestamp ASC LIMIT 50',
      [studentId, moduleId]
    );
    await connection.end();

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
};

// Get current progress for the module
const getProgress = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;

    const connection = await db();

    // Get progress from StudentModuleAssignment
    const [progress] = await connection.execute(
      'SELECT progress, hoursSpent, knowledge, status FROM StudentModuleAssignment WHERE studentId = ? AND moduleId = ?',
      [studentId, moduleId]
    );

    const progressData = progress.length > 0 ? progress[0] : {
      progress: 0,
      hoursSpent: 0,
      knowledge: 0,
      status: 'not_started'
    };

    await connection.end();

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message
    });
  }
};

// Update progress for the module
const updateProgress = async (req, res) => {
  try {
    const studentId = req.session.user.userId;
    const { moduleId } = req.params;
    const { progress, hoursSpent, knowledge } = req.body;

    const connection = await db();

    // Update or insert progress
    await connection.execute(
      'INSERT INTO StudentModuleAssignment (studentId, moduleId, progress, hoursSpent, knowledge, status, assignedAt) VALUES (?, ?, ?, ?, ?, "in_progress", NOW()) ON DUPLICATE KEY UPDATE progress = VALUES(progress), hoursSpent = VALUES(hoursSpent), knowledge = VALUES(knowledge)',
      [studentId, moduleId, progress || 0, hoursSpent || 0, knowledge || 0]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
};

module.exports = {
  getModuleDetails,
  getBookmarks,
  saveBookmark,
  getNotes,
  saveNotes,
  logInteraction,
  chatWithAI,
  getChatHistory,
  getProgress,
  updateProgress
};
