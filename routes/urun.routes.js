const express = require('express');
const router = express.Router();
const urunController = require('../controllers/urun.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

// Dosya yükleme konfigürasyonu
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/urunler/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5242880 }, // 5MB
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Hata: Sadece resim yükleyebilirsiniz!');
    }
  }
});

// Tüm ürünleri listele
router.get('/', urunController.getAllUrunler);

// Ürün detayını getir
router.get('/:id', urunController.getUrunById);

// Yeni ürün ekle (sadece admin)
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('resim'), urunController.createUrun);

// Ürün güncelle (sadece admin)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('resim'), urunController.updateUrun);

// Ürün stok durumunu güncelle (sadece admin ve garson)
router.put('/:id/stok', authMiddleware.verifyToken, authMiddleware.isGarson, urunController.updateUrunStok);

// Ürün sil (sadece admin)
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, urunController.deleteUrun);

module.exports = router; 