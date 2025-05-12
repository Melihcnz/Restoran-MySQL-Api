const express = require('express');
const router = express.Router();
const faturaController = require('../controllers/fatura.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm faturaları listele
router.get('/', authMiddleware.verifyToken, faturaController.getAllFaturalar);

// Fatura detayını getir
router.get('/:id', authMiddleware.verifyToken, faturaController.getFaturaById);

// Yeni fatura oluştur
router.post('/', authMiddleware.verifyToken, authMiddleware.isKasiyer, faturaController.createFatura);

// Fatura güncelle
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isKasiyer, faturaController.updateFatura);

// Fatura durumunu güncelle
router.put('/:id/durum', authMiddleware.verifyToken, authMiddleware.isKasiyer, faturaController.updateFaturaDurum);

// Fatura iptal et
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, faturaController.deleteFatura);

// Sipariş bazlı fatura getir
router.get('/siparis/:siparisId', authMiddleware.verifyToken, faturaController.getFaturaBySiparis);

// Müşteri bazlı faturaları getir
router.get('/musteri/:musteriId', authMiddleware.verifyToken, faturaController.getFaturalarByMusteri);

// Tarih aralığına göre faturaları getir
router.get('/tarih/:baslangic/:bitis', authMiddleware.verifyToken, faturaController.getFaturalarByTarih);

// Ödeme türüne göre faturaları getir
router.get('/odeme-turu/:odemeTuru', authMiddleware.verifyToken, faturaController.getFaturalarByOdemeTuru);

module.exports = router; 