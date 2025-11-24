const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

function authGuard(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

function apiAuthGuard(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Нужна авторизация' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({ message: 'Сессия истекла' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ message: 'Сессия истекла' });
  }
}

module.exports = {
  authGuard,
  apiAuthGuard
};
