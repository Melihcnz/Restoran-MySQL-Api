const db = require('../models');
const Urun = db.Urun;
const Kategori = db.Kategori;
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

/**
 * Tüm ürünleri listele
 */
exports.getAllUrunler = async (req, res) => {
  try {
    const { kategori_id, stok_durumu, ad } = req.query;
    let whereClause = {};

    // Filtreleme opsiyonları
    if (kategori_id) {
      whereClause.kategori_id = kategori_id;
    }

    if (stok_durumu !== undefined) {
      whereClause.stok_durumu = stok_durumu === 'true';
    }

    if (ad) {
      whereClause.ad = { [Op.like]: `%${ad}%` };
    }

    const urunler = await Urun.findAll({
      where: whereClause,
      include: [
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['id', 'ad']
        }
      ],
      order: [
        ['kategori_id', 'ASC'],
        ['ad', 'ASC']
      ]
    });

    res.status(200).json(urunler);
  } catch (error) {
    console.error('Ürünleri listelerken hata:', error);
    res.status(500).json({
      message: 'Ürünler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Ürün detayını getir
 */
exports.getUrunById = async (req, res) => {
  try {
    const { id } = req.params;

    const urun = await Urun.findByPk(id, {
      include: [
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['id', 'ad']
        }
      ]
    });

    if (!urun) {
      return res.status(404).json({
        message: 'Ürün bulunamadı'
      });
    }

    res.status(200).json(urun);
  } catch (error) {
    console.error('Ürün detayı alınırken hata:', error);
    res.status(500).json({
      message: 'Ürün detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni ürün ekle
 */
exports.createUrun = async (req, res) => {
  try {
    const { kategori_id, ad, aciklama, fiyat, stok_durumu } = req.body;

    // Gerekli alanları kontrol et
    if (!kategori_id || !ad || fiyat === undefined) {
      return res.status(400).json({
        message: 'Kategori ID, ürün adı ve fiyat alanları zorunludur'
      });
    }

    // Kategori var mı kontrol et
    const kategori = await Kategori.findByPk(kategori_id);
    if (!kategori) {
      return res.status(404).json({
        message: 'Seçilen kategori bulunamadı'
      });
    }

    // Resim var mı kontrol et
    let resim_url = null;
    if (req.file) {
      resim_url = `uploads/urunler/${req.file.filename}`;
    }

    // Yeni ürün oluştur
    const yeniUrun = await Urun.create({
      kategori_id,
      ad,
      aciklama,
      fiyat,
      resim_url,
      stok_durumu: stok_durumu !== undefined ? stok_durumu : true,
      olusturma_tarihi: new Date()
    });

    const urunData = await Urun.findByPk(yeniUrun.id, {
      include: [
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['id', 'ad']
        }
      ]
    });

    res.status(201).json(urunData);
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    res.status(500).json({
      message: 'Ürün oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Ürün güncelle
 */
exports.updateUrun = async (req, res) => {
  try {
    const { id } = req.params;
    const { kategori_id, ad, aciklama, fiyat, stok_durumu } = req.body;

    // Ürünü bul
    const urun = await Urun.findByPk(id);

    if (!urun) {
      return res.status(404).json({
        message: 'Ürün bulunamadı'
      });
    }

    // Kategori ID değiştiyse kontrol et
    if (kategori_id && kategori_id !== urun.kategori_id) {
      const kategori = await Kategori.findByPk(kategori_id);
      if (!kategori) {
        return res.status(404).json({
          message: 'Seçilen kategori bulunamadı'
        });
      }
    }

    // Resim değiştiyse eski resmi sil
    let resim_url = urun.resim_url;
    if (req.file) {
      // Eski resmi sil (varsa)
      if (urun.resim_url) {
        const eskiResimYolu = path.join(__dirname, '..', urun.resim_url);
        if (fs.existsSync(eskiResimYolu)) {
          fs.unlinkSync(eskiResimYolu);
        }
      }
      resim_url = `uploads/urunler/${req.file.filename}`;
    }

    // Ürünü güncelle
    await urun.update({
      kategori_id: kategori_id || urun.kategori_id,
      ad: ad || urun.ad,
      aciklama: aciklama !== undefined ? aciklama : urun.aciklama,
      fiyat: fiyat !== undefined ? fiyat : urun.fiyat,
      resim_url,
      stok_durumu: stok_durumu !== undefined ? stok_durumu : urun.stok_durumu
    });

    const updatedUrun = await Urun.findByPk(id, {
      include: [
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['id', 'ad']
        }
      ]
    });

    res.status(200).json(updatedUrun);
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({
      message: 'Ürün güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Ürün stok durumunu güncelle
 */
exports.updateUrunStok = async (req, res) => {
  try {
    const { id } = req.params;
    const { stok_durumu } = req.body;

    // Stok durumu kontrolü
    if (stok_durumu === undefined) {
      return res.status(400).json({
        message: 'Stok durumu belirtilmelidir'
      });
    }

    // Ürünü bul
    const urun = await Urun.findByPk(id);

    if (!urun) {
      return res.status(404).json({
        message: 'Ürün bulunamadı'
      });
    }

    // Stok durumunu güncelle
    await urun.update({ stok_durumu });

    res.status(200).json({
      id: urun.id,
      ad: urun.ad,
      stok_durumu: urun.stok_durumu
    });
  } catch (error) {
    console.error('Stok durumu güncelleme hatası:', error);
    res.status(500).json({
      message: 'Stok durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Ürün sil
 */
exports.deleteUrun = async (req, res) => {
  try {
    const { id } = req.params;

    // Ürünü bul
    const urun = await Urun.findByPk(id);

    if (!urun) {
      return res.status(404).json({
        message: 'Ürün bulunamadı'
      });
    }

    // Ürüne bağlı sipariş detayları olabilir, bunlar sipariş geçmişi için korunabilir
    // veya ilişkili kayıtların silinmesini istiyorsanız cascade seçeneği kullanılabilir

    // Resmi sil (varsa)
    if (urun.resim_url) {
      const resimYolu = path.join(__dirname, '..', urun.resim_url);
      if (fs.existsSync(resimYolu)) {
        fs.unlinkSync(resimYolu);
      }
    }

    // Ürünü sil
    await urun.destroy();

    res.status(200).json({
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    res.status(500).json({
      message: 'Ürün silinirken bir hata oluştu',
      error: error.message
    });
  }
}; 