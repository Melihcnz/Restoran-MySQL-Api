const express = require('express');
const router = express.Router();
const rezervasyonController = require('../controllers/rezervasyon.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm rezervasyonları listele
router.get('/', authMiddleware.verifyToken, rezervasyonController.getAllRezervasyonlar);

// Rezervasyon detayını getir
router.get('/:id', authMiddleware.verifyToken, rezervasyonController.getRezervasyonById);

// Yeni rezervasyon ekle
router.post('/', authMiddleware.verifyToken, rezervasyonController.createRezervasyon);

// Rezervasyon güncelle
router.put('/:id', authMiddleware.verifyToken, rezervasyonController.updateRezervasyon);

// Rezervasyon durumunu güncelle
router.put('/:id/durum', authMiddleware.verifyToken, rezervasyonController.updateRezervasyonDurum);

// Rezervasyon iptal et
router.delete('/:id', authMiddleware.verifyToken, rezervasyonController.deleteRezervasyon);

// Belirli tarihteki rezervasyonları getir
router.get('/tarih/:tarih', authMiddleware.verifyToken, rezervasyonController.getRezervasyonlarByTarih);

// Tarih aralığındaki rezervasyonları getir
router.get('/tarih-aralik/:baslangic/:bitis', authMiddleware.verifyToken, rezervasyonController.getRezervasyonlarByTarihAralik);

// Masa bazlı rezervasyonları getir
router.get('/masa/:masaId', authMiddleware.verifyToken, rezervasyonController.getRezervasyonlarByMasa);

// Müşteri bazlı rezervasyonları getir
router.get('/musteri/:musteriId', authMiddleware.verifyToken, rezervasyonController.getRezervasyonlarByMusteri);

module.exports = router; 