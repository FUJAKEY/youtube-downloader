const express = require('express');
const { downloadVideo } = require('../controllers/downloadController');
const { apiAuthGuard } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/api/download', apiAuthGuard, downloadVideo);

module.exports = router;
