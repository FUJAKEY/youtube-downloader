const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { File } = require('../models');
const isAuthenticated = require('../middleware/auth');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Dashboard (List files)
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const files = await File.findAll({
            where: { userId: req.session.userId },
            order: [['createdAt', 'DESC']]
        });
        res.render('dashboard', { title: 'Мой Диск', files, user: req.session.userId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Upload File
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.redirect('/dashboard');
        }

        await File.create({
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            userId: req.session.userId
        });

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка загрузки');
    }
});

// Download File
router.get('/file/:id/download', isAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({
            where: { id: req.params.id, userId: req.session.userId }
        });

        if (!file) {
            return res.status(404).send('Файл не найден');
        }

        res.download(file.path, file.originalName);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка скачивания');
    }
});

// Delete File
router.post('/file/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({
            where: { id: req.params.id, userId: req.session.userId }
        });

        if (file) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            await file.destroy();
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка удаления');
    }
});

module.exports = router;
