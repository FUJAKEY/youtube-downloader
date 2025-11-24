const bcrypt = require('bcrypt');
const db = require('../models');
const User = db.User;

exports.registerForm = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('register', { error: null });
};

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.redirect('/auth/login');
    } catch (error) {
        res.render('register', { error: 'Username already exists' });
    }
};

exports.loginForm = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.render('login', { error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        res.redirect('/');
    } catch (error) {
        res.render('login', { error: 'An error occurred' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};
