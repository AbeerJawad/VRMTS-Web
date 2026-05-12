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
  return res.status(501).json({ success: false, message: 'AI question preview is disabled in this environment.' });
}

// Generate quiz from RAG MCQ bank and store in DB
async function generateQuizFromRAG(req, res) {
  return res.status(501).json({ success: false, message: 'AI quiz generation is disabled in this environment.' });
}

module.exports = { generateQuizFromRAG, previewRagQuestions };
