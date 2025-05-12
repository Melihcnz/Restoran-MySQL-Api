const express = require('express');
const router = express.Router();
const kullaniciController = require('../controllers/kullanici.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm kullanıcıları listele (sadece admin)
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, kullaniciController.getAllKullanicilar);

// Kullanıcı detayını getir
router.get('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, kullaniciController.getKullaniciById);

// Yeni kullanıcı ekle (sadece admin)
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, kullaniciController.createKullanici);

// Kullanıcı güncelle
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, kullaniciController.updateKullanici);

// Kullanıcı sil
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, kullaniciController.deleteKullanici);

// Şifre güncelle
router.put('/:id/sifre', authMiddleware.verifyToken, kullaniciController.updatePassword);

module.exports = router; 