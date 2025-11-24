const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, videoController.dashboard);
router.post('/get-info', authMiddleware, videoController.getVideoInfo);
router.get('/download', authMiddleware, videoController.downloadVideo);

module.exports = router;
