const express = require('express');
const router = express.Router();
const moduleExplorationController = require('../controllers/moduleExploration.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Module exploration routes
router.get('/:moduleId/details', moduleExplorationController.getModuleDetails);
router.get('/:moduleId/bookmarks', moduleExplorationController.getBookmarks);
router.post('/:moduleId/bookmarks', moduleExplorationController.saveBookmark);
router.get('/:moduleId/notes', moduleExplorationController.getNotes);
router.post('/:moduleId/notes', moduleExplorationController.saveNotes);
router.post('/:moduleId/interactions', moduleExplorationController.logInteraction);
router.get('/:moduleId/chat/history', moduleExplorationController.getChatHistory);
router.post('/:moduleId/chat', moduleExplorationController.chatWithAI);
router.get('/:moduleId/progress', moduleExplorationController.getProgress);
router.put('/:moduleId/progress', moduleExplorationController.updateProgress);

module.exports = router;
