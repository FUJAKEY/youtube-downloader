const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Setup
const sessionStore = new SequelizeStore({
    db: sequelize,
});

app.use(session({
    secret: 'secret_key_google_drive_clone',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Database Sync
sequelize.sync();
sessionStore.sync();

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/files'));

// Landing Page
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('index', { title: 'NodeDrive', user: null });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
