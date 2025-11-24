const express = require('express');
const router = express.Router();

router.get('/about', (req, res) => {
    res.render('about', {
        title: 'О нас',
        page: 'about'
    });
});

router.get('/services', (req, res) => {
    res.render('services', {
        title: 'Услуги',
        page: 'services'
    });
});

module.exports = router;
