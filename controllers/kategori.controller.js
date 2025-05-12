const db = require('../models');
const Kategori = db.Kategori;
const Urun = db.Urun;
const { Op } = require('sequelize');

/**
 * Tüm kategorileri listele
 */
exports.getAllKategoriler = async (req, res) => {
  try {
    const kategoriler = await Kategori.findAll({
      order: [['sira_no', 'ASC'], ['ad', 'ASC']]
    });

    res.status(200).json(kategoriler);
  } catch (error) {
    console.error('Kategorileri listelerken hata:', error);
    res.status(500).json({
      message: 'Kategoriler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kategori detayını getir
 */
exports.getKategoriById = async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await Kategori.findByPk(id);

    if (!kategori) {
      return res.status(404).json({
        message: 'Kategori bulunamadı'
      });
    }

    res.status(200).json(kategori);
  } catch (error) {
    console.error('Kategori detayı alınırken hata:', error);
    res.status(500).json({
      message: 'Kategori detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni kategori ekle
 */
exports.createKategori = async (req, res) => {
  try {
    const { ad, aciklama, sira_no } = req.body;

    // Kategori adı kontrolü
    if (!ad) {
      return res.status(400).json({
        message: 'Kategori adı zorunludur'
      });
    }

    // Kategori adı benzersiz mi?
    const existingKategori = await Kategori.findOne({
      where: { ad }
    });

    if (existingKategori) {
      return res.status(400).json({
        message: 'Bu kategori adı zaten kullanılıyor'
      });
    }

    // Yeni kategori oluştur
    const yeniKategori = await Kategori.create({
      ad,
      aciklama,
      sira_no: sira_no || 0,
      olusturma_tarihi: new Date()
    });

    res.status(201).json(yeniKategori);
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({
      message: 'Kategori oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kategori güncelle
 */
exports.updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, aciklama, sira_no } = req.body;

    // Kategoriyi bul
    const kategori = await Kategori.findByPk(id);

    if (!kategori) {
      return res.status(404).json({
        message: 'Kategori bulunamadı'
      });
    }

    // Kategori adı değiştiriliyorsa benzersiz mi kontrol et
    if (ad && ad !== kategori.ad) {
      const existingKategori = await Kategori.findOne({
        where: {
          ad,
          id: { [Op.ne]: id }
        }
      });

      if (existingKategori) {
        return res.status(400).json({
          message: 'Bu kategori adı zaten kullanılıyor'
        });
      }
    }

    // Kategoriyi güncelle
    await kategori.update({
      ad: ad || kategori.ad,
      aciklama: aciklama !== undefined ? aciklama : kategori.aciklama,
      sira_no: sira_no !== undefined ? sira_no : kategori.sira_no
    });

    res.status(200).json(kategori);
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error);
    res.status(500).json({
      message: 'Kategori güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kategori sil
 */
exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;

    // Kategoriyi bul
    const kategori = await Kategori.findByPk(id);

    if (!kategori) {
      return res.status(404).json({
        message: 'Kategori bulunamadı'
      });
    }

    // Kategoriye bağlı ürünler var mı kontrol et
    const urunSayisi = await Urun.count({
      where: { kategori_id: id }
    });

    if (urunSayisi > 0) {
      return res.status(400).json({
        message: 'Kategoriye ait ürünler olduğu için kategori silinemez',
        urun_sayisi: urunSayisi
      });
    }

    // Kategoriyi sil
    await kategori.destroy();

    res.status(200).json({
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({
      message: 'Kategori silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kategoriye ait ürünleri getir
 */
exports.getKategoriUrunler = async (req, res) => {
  try {
    const { id } = req.params;

    // Kategoriyi kontrol et
    const kategori = await Kategori.findByPk(id);

    if (!kategori) {
      return res.status(404).json({
        message: 'Kategori bulunamadı'
      });
    }

    // Kategoriye ait ürünleri getir
    const urunler = await Urun.findAll({
      where: { kategori_id: id },
      order: [['ad', 'ASC']]
    });

    res.status(200).json(urunler);
  } catch (error) {
    console.error('Kategori ürünleri alınırken hata:', error);
    res.status(500).json({
      message: 'Kategori ürünleri alınırken bir hata oluştu',
      error: error.message
    });
  }
}; 