const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Kullanıcı kaydı
router.post('/register', authController.register);

// Admin kullanıcı kaydı
router.post('/register-admin', authController.registerAdmin);

// Kullanıcı girişi
router.post('/login', authController.login);

// Kullanıcı çıkışı
router.post('/logout', authMiddleware.verifyToken, authController.logout);

// Kullanıcı bilgilerini getir
router.get('/me', authMiddleware.verifyToken, authController.getMe);

module.exports = router; 