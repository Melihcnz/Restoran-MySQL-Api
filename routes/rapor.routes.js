const express = require('express');
const router = express.Router();
const raporController = require('../controllers/rapor.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Satış raporu
router.get('/satis', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getSatisRaporu);

// Ürün bazlı raporlar
router.get('/urunler', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getUrunRaporu);

// Müşteri bazlı raporlar
router.get('/musteriler', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getMusteriRaporu);

// Günlük satış raporu
router.get('/gunluk', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getGunlukRapor);

// Aylık satış raporu
router.get('/aylik/:ay/:yil', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getAylikRapor);

// Yıllık satış raporu
router.get('/yillik/:yil', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getYillikRapor);

// Kategori bazlı satış raporu
router.get('/kategori/:kategoriId', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getKategoriRaporu);

// Kullanıcı bazlı satış raporu
router.get('/kullanici/:kullaniciId', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getKullaniciRaporu);

// Tarih aralığı satış raporu
router.get('/tarih/:baslangic/:bitis', authMiddleware.verifyToken, authMiddleware.isAdmin, raporController.getTarihAraligiRaporu);

module.exports = router; 