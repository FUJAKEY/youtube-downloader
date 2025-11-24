const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const { authGuard, apiAuthGuard } = require('./middleware/authMiddleware');
const { findUserById } = require('./services/userService');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

app.use((req, res, next) => {
  res.locals.user = null;
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = findUserById(payload.sub);
      if (user) {
        res.locals.user = user;
      }
    } catch (error) {
      res.clearCookie('token');
    }
  }
  next();
});

app.use(authRoutes);
app.use(downloadRoutes);

app.get('/', (req, res) => {
  res.render('index', { title: 'StreamMaster | Многоуровневый загрузчик', user: res.locals.user });
});

app.get('/dashboard', authGuard, (req, res) => {
  res.render('dashboard', { title: 'Личный кабинет | StreamMaster', user: req.user });
});

app.get('/api/profile', apiAuthGuard, (req, res) => {
  res.json({ email: req.user.email, createdAt: req.user.createdAt });
});

app.use((req, res) => {
  res.status(404).render('index', { title: 'Страница не найдена', user: res.locals.user });
});

app.listen(PORT, () => {
  console.log(`🚀 StreamMaster запущен на http://localhost:${PORT}`);
});
