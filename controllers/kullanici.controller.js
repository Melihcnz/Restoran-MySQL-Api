const db = require('../models');
const Kullanici = db.Kullanici;
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Tüm kullanıcıları listele
 */
exports.getAllKullanicilar = async (req, res) => {
  try {
    const kullanicilar = await Kullanici.findAll({
      attributes: { exclude: ['sifre'] }, // Şifreyi hariç tut
      order: [['id', 'ASC']]
    });

    res.status(200).json(kullanicilar);
  } catch (error) {
    console.error('Kullanıcıları listelerken hata:', error);
    res.status(500).json({
      message: 'Kullanıcılar listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcı detayını getir
 */
exports.getKullaniciById = async (req, res) => {
  try {
    const { id } = req.params;

    const kullanici = await Kullanici.findByPk(id, {
      attributes: { exclude: ['sifre'] } // Şifreyi hariç tut
    });

    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.status(200).json(kullanici);
  } catch (error) {
    console.error('Kullanıcı detayı alınırken hata:', error);
    res.status(500).json({
      message: 'Kullanıcı detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni kullanıcı ekle
 */
exports.createKullanici = async (req, res) => {
  try {
    const { kullanici_adi, sifre, ad_soyad, yetki, email, telefon } = req.body;

    // Gerekli alanları kontrol et
    if (!kullanici_adi || !sifre || !ad_soyad) {
      return res.status(400).json({
        message: 'Kullanıcı adı, şifre ve ad soyad alanları zorunludur'
      });
    }

    // Kullanıcı adı benzersiz mi?
    const existingKullanici = await Kullanici.findOne({
      where: { kullanici_adi }
    });

    if (existingKullanici) {
      return res.status(400).json({
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    // Yeni kullanıcı oluştur
    const yeniKullanici = await Kullanici.create({
      kullanici_adi,
      sifre,
      ad_soyad,
      yetki,
      email,
      telefon,
      olusturma_tarihi: new Date()
    });

    // Şifreyi hariç tut
    const kullaniciData = { ...yeniKullanici.toJSON() };
    delete kullaniciData.sifre;

    res.status(201).json(kullaniciData);
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    res.status(500).json({
      message: 'Kullanıcı oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcı güncelle
 */
exports.updateKullanici = async (req, res) => {
  try {
    const { id } = req.params;
    const { kullanici_adi, ad_soyad, yetki, email, telefon } = req.body;

    // Kullanıcıyı bul
    const kullanici = await Kullanici.findByPk(id);

    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcı adı değiştiriliyorsa benzersiz mi kontrol et
    if (kullanici_adi && kullanici_adi !== kullanici.kullanici_adi) {
      const existingKullanici = await Kullanici.findOne({
        where: {
          kullanici_adi,
          id: { [Op.ne]: id }
        }
      });

      if (existingKullanici) {
        return res.status(400).json({
          message: 'Bu kullanıcı adı zaten kullanılıyor'
        });
      }
    }

    // Kullanıcıyı güncelle
    await kullanici.update({
      kullanici_adi: kullanici_adi || kullanici.kullanici_adi,
      ad_soyad: ad_soyad || kullanici.ad_soyad,
      yetki: yetki || kullanici.yetki,
      email: email || kullanici.email,
      telefon: telefon || kullanici.telefon
    });

    // Şifreyi hariç tut
    const kullaniciData = { ...kullanici.toJSON() };
    delete kullaniciData.sifre;

    res.status(200).json(kullaniciData);
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({
      message: 'Kullanıcı güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcı sil
 */
exports.deleteKullanici = async (req, res) => {
  try {
    const { id } = req.params;

    // Kullanıcıyı bul
    const kullanici = await Kullanici.findByPk(id);

    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcıyı sil
    await kullanici.destroy();

    res.status(200).json({
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({
      message: 'Kullanıcı silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Şifre güncelle
 */
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { eski_sifre, yeni_sifre } = req.body;

    // İsteği yapan kullanıcı ya kendisi ya da admin olmalı
    if (String(req.kullanici.id) !== String(id) && req.kullanici.yetki !== 'admin') {
      return res.status(403).json({
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    // Kullanıcıyı bul
    const kullanici = await Kullanici.findByPk(id);

    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Admin değilse eski şifreyi kontrol et
    if (req.kullanici.yetki !== 'admin') {
      const sifreGecerli = await kullanici.sifreDogrula(eski_sifre);
      if (!sifreGecerli) {
        return res.status(401).json({
          message: 'Eski şifre yanlış'
        });
      }
    }

    // Şifreyi hash'le ve güncelle
    kullanici.sifre = yeni_sifre;
    await kullanici.save();

    res.status(200).json({
      message: 'Şifre başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Şifre güncelleme hatası:', error);
    res.status(500).json({
      message: 'Şifre güncellenirken bir hata oluştu',
      error: error.message
    });
  }
}; 