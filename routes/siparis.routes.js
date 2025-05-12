const express = require('express');
const router = express.Router();
const siparisController = require('../controllers/siparis.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm siparişleri listele
router.get('/', authMiddleware.verifyToken, siparisController.getAllSiparisler);

// Sipariş detayını getir
router.get('/:id', authMiddleware.verifyToken, siparisController.getSiparisById);

// Yeni sipariş oluştur
router.post('/', authMiddleware.verifyToken, authMiddleware.isGarson, siparisController.createSiparis);

// Sipariş güncelle
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isGarson, siparisController.updateSiparis);

// Sipariş durumunu güncelle
router.put('/:id/durum', authMiddleware.verifyToken, siparisController.updateSiparisDurum);

// Sipariş iptal et
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isGarson, siparisController.deleteSiparis);

// Masa bazlı siparişleri getir
router.get('/masa/:masaId', authMiddleware.verifyToken, siparisController.getSiparislerByMasa);

// Aktif siparişleri getir
router.get('/durum/aktif', authMiddleware.verifyToken, siparisController.getAktifSiparisler);

// Tarih aralığına göre siparişleri getir
router.get('/tarih/:baslangic/:bitis', authMiddleware.verifyToken, siparisController.getSiparislerByTarih);

// Kullanıcı bazlı siparişleri getir
router.get('/kullanici/:kullaniciId', authMiddleware.verifyToken, siparisController.getSiparislerByKullanici);

module.exports = router; 