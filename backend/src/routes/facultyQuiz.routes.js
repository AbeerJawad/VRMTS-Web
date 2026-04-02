const express = require('express');
const router = express.Router();
const facultyQuizController = require('../controllers/facultyQuiz.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All faculty routes require authentication
router.use(authMiddleware);

// Middleware to ensure user is a faculty member
const facultyOnly = (req, res, next) => {
    if (req.session.user && req.session.user.userType === 'teacher') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Teachers only.' });
    }
};

// Apply facultyOnly to all routes in this router
router.use(facultyOnly);

// Generation & Staging
router.post('/generate-questions', facultyQuizController.generateQuestions);
router.get('/pending-questions', facultyQuizController.getStagingQuestions);
router.patch('/staging-question/:stagingId', facultyQuizController.updateStagingQuestion);
router.post('/approve-questions', facultyQuizController.approveQuestions);

module.exports = router;
