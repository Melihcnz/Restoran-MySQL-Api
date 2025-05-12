const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm kategorileri listele
router.get('/', kategoriController.getAllKategoriler);

// Kategori detayını getir
router.get('/:id', kategoriController.getKategoriById);

// Yeni kategori ekle (sadece admin)
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, kategoriController.createKategori);

// Kategori güncelle (sadece admin)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, kategoriController.updateKategori);

// Kategori sil (sadece admin)
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, kategoriController.deleteKategori);

// Kategoriye ait ürünleri getir
router.get('/:id/urunler', kategoriController.getKategoriUrunler);

module.exports = router; 