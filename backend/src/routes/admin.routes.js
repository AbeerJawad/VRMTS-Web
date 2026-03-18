const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminMiddleware = require('../middleware/admin.middleware');

// Apply admin protection to all routes in this file
router.use(adminMiddleware);

router.get('/stats', adminController.getDashboardStats);
router.get('/students', adminController.getStudents);
router.get('/teachers', adminController.getTeachers);

router.post('/student', adminController.createStudentAccount);
router.post('/faculty', adminController.createFacultyAccount);
router.post('/bulk-upload', adminController.bulkUploadStudents);
router.post('/update-status', adminController.updateStudentStatus);
router.post('/assign-teacher', adminController.assignTeacherToStudent);
router.post('/announce', adminController.sendGlobalAnnouncement);
router.get('/logs', adminController.getAuditLogs);

module.exports = router;
