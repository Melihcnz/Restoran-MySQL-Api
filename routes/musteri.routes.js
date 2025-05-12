const express = require('express');
const router = express.Router();
const musteriController = require('../controllers/musteri.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm müşterileri listele
router.get('/', authMiddleware.verifyToken, musteriController.getAllMusteriler);

// Müşteri detayını getir
router.get('/:id', authMiddleware.verifyToken, musteriController.getMusteriById);

// Yeni müşteri ekle
router.post('/', authMiddleware.verifyToken, musteriController.createMusteri);

// Müşteri güncelle
router.put('/:id', authMiddleware.verifyToken, musteriController.updateMusteri);

// Müşteri sil
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, musteriController.deleteMusteri);

// Müşteriye ait siparişleri getir
router.get('/:id/siparisler', authMiddleware.verifyToken, musteriController.getMusteriSiparisler);

// Müşteriye ait rezervasyonları getir
router.get('/:id/rezervasyonlar', authMiddleware.verifyToken, musteriController.getMusteriRezervasyonlar);

// Müşteriye ait faturaları getir
router.get('/:id/faturalar', authMiddleware.verifyToken, musteriController.getMusteriFaturalar);

// Telefon numarasına göre müşteri ara
router.get('/telefon/:telefon', authMiddleware.verifyToken, musteriController.getMusteriByTelefon);

module.exports = router; 