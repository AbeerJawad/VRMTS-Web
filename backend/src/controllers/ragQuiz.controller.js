const db = require('../config/db');

// RAG service URL: prioritize env vars, default to docker service name 'rag'
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || process.env.RAG_BASE_URL || 'http://rag:8000';

async function fetchRagMcqs(labNumber) {
  const ragResponse = await fetch(`${RAG_SERVICE_URL}/mcqs/${labNumber}`);
  if (!ragResponse.ok) {
    throw new Error(`RAG service returned ${ragResponse.status} for lab ${labNumber}`);
  }
  const ragData = await ragResponse.json();
  if (ragData.error) {
    throw new Error(ragData.error);
  }
  return ragData.mcqs || [];
}

// Preview questions from RAG bank without creating a DB quiz
async function previewRagQuestions(req, res) {
  try {
    const { labNumber, questionCount } = req.body;
    if (!labNumber || !questionCount) {
      return res.status(400).json({ success: false, message: 'labNumber and questionCount required' });
    }

    const count = Math.max(1, Math.min(parseInt(questionCount, 10), 40));
    const mcqs = await fetchRagMcqs(labNumber);
    const selected = mcqs.slice(0, count).map((q) => ({
      question: q.question || '',
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation || q.source || '',
      difficulty: q.difficulty || 'medium'
    }));

    return res.json({ success: true, totalQuestions: selected.length, data: selected });
  } catch (err) {
    console.error('Error previewing RAG questions:', err);
    return res.status(502).json({ success: false, message: 'Could not fetch RAG question bank', error: err.message });
  }
}

// Generate quiz from RAG MCQ bank and store in DB
async function generateQuizFromRAG(req, res) {
  try {
    const { labNumber, questionCount } = req.body;
    if (!labNumber || !questionCount) {
      return res.status(400).json({ success: false, message: 'labNumber and questionCount required' });
    }

    let mcqs;
    try {
      mcqs = await fetchRagMcqs(labNumber);
    } catch (fetchErr) {
      console.error('Failed to fetch MCQs from RAG service:', fetchErr);
      return res.status(502).json({ success: false, message: 'Could not reach RAG service. Is it running?', error: fetchErr.message });
    }
    const selected = mcqs.slice(0, questionCount);
    const connection = await db();
    // Create quiz record
    const [quizResult] = await connection.execute(
      'INSERT INTO Quiz (moduleId, title, timeLimit, totalQuestions, passingScore, isCustom) VALUES (?, ?, ?, ?, ?, 1)',
      [labNumber, `RAG Quiz Lab ${labNumber}`, 30, selected.length, 60]
    );
    const quizId = quizResult.insertId;
    // Insert questions: first into questionbank, then into quizquestion
    for (let i = 0; i < selected.length; i++) {
      const q = selected[i];
      const questionText = q.question ?? null;
      const difficulty = 'medium';
      const points = q.points !== undefined ? q.points : 1;
      const displayOrder = i + 1;
      const options = q.options ? JSON.stringify(q.options) : null;
      let correctAnswer = null;
      if (Array.isArray(q.options) && typeof q.correctIndex === 'number') {
        correctAnswer = q.options[q.correctIndex] ?? null;
      }
      // Insert into questionbank first
      const [bankResult] = await connection.execute(
        'INSERT INTO questionbank (questionType, difficulty, topic, moduleId, correctAnswer, options, questionText) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['multiple_choice', difficulty, q.tag ?? null, labNumber, correctAnswer, options, questionText]
      );
      const bankId = bankResult.insertId;
      // Insert into quizquestion referencing bankId
      await connection.execute(
        'INSERT INTO quizquestion (quizId, bankId, questionText, difficulty, points, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
        [quizId, bankId, questionText, difficulty, points, displayOrder]
      );
    }
    await connection.end();
    return res.json({ success: true, quizId, totalQuestions: selected.length });
  } catch (err) {
    console.error('Error generating quiz from RAG:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate quiz', error: err.message });
  }
}

module.exports = { generateQuizFromRAG, previewRagQuestions };
