const express = require('express');
const router = express.Router();
const { User } = require('../models');

// GET Login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// POST Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || !(await user.validatePassword(password))) {
            return res.render('login', { error: 'Неверное имя пользователя или пароль' });
        }

        req.session.userId = user.id;
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Произошла ошибка' });
    }
});

// GET Register
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// POST Register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.render('register', { error: 'Пользователь уже существует' });
        }

        const user = await User.create({ username, password });
        req.session.userId = user.id;
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('register', { error: 'Произошла ошибка при регистрации' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
