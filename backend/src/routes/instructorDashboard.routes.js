const express = require('express');
const router = express.Router();
const instructorDashboardController = require('../controllers/instructorDashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/class-stats', instructorDashboardController.getClassStats);
router.get('/module-performance', instructorDashboardController.getModulePerformance);
router.get('/recent-submissions', instructorDashboardController.getRecentSubmissions);
router.get('/at-risk-students', instructorDashboardController.getAtRiskStudents);
router.get('/top-performers', instructorDashboardController.getTopPerformers);
router.get('/upcoming-deadlines', instructorDashboardController.getUpcomingDeadlines);
router.get('/my-students', instructorDashboardController.getMyStudents);
router.post('/assign-module', instructorDashboardController.assignModuleToStudent);
router.post('/assign-module-class', instructorDashboardController.assignModuleToClass);
router.get('/active-assignments', instructorDashboardController.getActiveAssignments);
router.delete('/unassign-module', instructorDashboardController.unassignModuleFromStudent);
router.delete('/unassign-module-batch', instructorDashboardController.unassignModuleFromBatch);
router.get('/class-analytics', instructorDashboardController.getClassAnalytics);

module.exports = router;






