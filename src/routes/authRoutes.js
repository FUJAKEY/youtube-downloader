const express = require('express');
const { renderLogin, renderRegister, login, register, logout } = require('../controllers/authController');
const router = express.Router();

router.get('/login', renderLogin);
router.get('/register', renderRegister);
router.post('/api/auth/login', login);
router.post('/api/auth/register', register);
router.post('/api/auth/logout', logout);

module.exports = router;
