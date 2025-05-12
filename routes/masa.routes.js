const express = require('express');
const router = express.Router();
const masaController = require('../controllers/masa.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm masaları listele
router.get('/', authMiddleware.verifyToken, masaController.getAllMasalar);

// Masa detayını getir
router.get('/:id', authMiddleware.verifyToken, masaController.getMasaById);

// Yeni masa ekle (sadece admin)
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, masaController.createMasa);

// Masa güncelle (sadece admin)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, masaController.updateMasa);

// Masa durumunu güncelle
router.put('/:id/durum', authMiddleware.verifyToken, authMiddleware.isGarson, masaController.updateMasaDurum);

// Masa sil (sadece admin)
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, masaController.deleteMasa);

// Masa siparişlerini getir
router.get('/:id/siparisler', authMiddleware.verifyToken, masaController.getMasaSiparisler);

module.exports = router; 