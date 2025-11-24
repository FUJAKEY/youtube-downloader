const jwt = require('jsonwebtoken');
const { createUser, validateUser } = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const JWT_TTL = '2h';

function issueToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_TTL });
}

function renderLogin(req, res) {
  if (req.cookies.token) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { title: 'Вход | StreamMaster', user: null });
}

function renderRegister(req, res) {
  if (req.cookies.token) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', { title: 'Регистрация | StreamMaster', user: null });
}

function logout(req, res) {
  res.clearCookie('token');
  res.redirect('/login');
}

function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Укажите корректный email и пароль длиной от 6 символов' });
  }
  try {
    const user = createUser(email, password);
    const token = issueToken(user.id);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2
    });
    return res.json({ email: user.email });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

function login(req, res) {
  const { email, password } = req.body;
  const user = validateUser(email, password);
  if (!user) {
    return res.status(401).json({ message: 'Неверная пара email/пароль' });
  }
  const token = issueToken(user.id);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2
  });
  return res.json({ email: user.email });
}

module.exports = {
  renderLogin,
  renderRegister,
  login,
  register,
  logout
};
