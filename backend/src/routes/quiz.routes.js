const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get available modules for quiz selection
router.get('/modules', quizController.getQuizModules);

// Get quiz statistics
router.get('/stats', quizController.getQuizStats);

// Get previous quiz attempts
router.get('/attempts', quizController.getQuizAttempts);

// Start a module quiz
router.post('/module/:moduleId/start', quizController.startModuleQuiz);

// Start a timed exam
router.post('/timed-exam/start', quizController.startTimedExam);

// Start an adaptive test
router.post('/adaptive/start', quizController.startAdaptiveTest);

// Submit an answer for a quiz attempt
router.post('/attempt/:attemptId/answer', quizController.submitAnswer);
// Alternative route for frontend compatibility
router.post('/submit-answer', quizController.submitAnswer);

// Get quiz progress for an attempt
router.get('/attempt/:attemptId/progress', quizController.getQuizProgress);

// Finish a quiz attempt
router.post('/attempt/:attemptId/finish', quizController.finishQuiz);

// Get details of a specific quiz attempt
router.get('/attempt/:attemptId', quizController.getQuizAttempt);

// Create a new customized quiz
router.post('/create', quizController.createQuiz);

// Get custom quizzes for a module
router.get('/module/:moduleId/custom', quizController.getCustomQuizzesByModule);

// Get questions for a specific quiz (instructor preview)
router.get('/:quizId/questions', quizController.getQuizQuestions);

// Teacher: Generate quiz from RAG MCQ bank
const ragQuizController = require('../controllers/ragQuiz.controller');
router.post('/preview-rag-questions', ragQuizController.previewRagQuestions);
router.post('/generate-rag-quiz', ragQuizController.generateQuizFromRAG);

module.exports = router;
