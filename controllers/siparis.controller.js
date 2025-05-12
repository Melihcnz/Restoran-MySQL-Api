const db = require('../models');
const Siparis = db.Siparis;
const SiparisDetay = db.SiparisDetay;
const Masa = db.Masa;
const Urun = db.Urun;
const Kullanici = db.Kullanici;
const Musteri = db.Musteri;
const { Op } = require('sequelize');
const sequelize = db.sequelize;

/**
 * Tüm siparişleri listele
 */
exports.getAllSiparisler = async (req, res) => {
  try {
    const { durum, baslangic_tarihi, bitis_tarihi } = req.query;
    let whereClause = {};

    // Filtreleme opsiyonları
    if (durum) {
      whereClause.durum = durum;
    }

    if (baslangic_tarihi && bitis_tarihi) {
      whereClause.olusturma_tarihi = {
        [Op.between]: [new Date(baslangic_tarihi), new Date(bitis_tarihi)]
      };
    } else if (baslangic_tarihi) {
      whereClause.olusturma_tarihi = {
        [Op.gte]: new Date(baslangic_tarihi)
      };
    } else if (bitis_tarihi) {
      whereClause.olusturma_tarihi = {
        [Op.lte]: new Date(bitis_tarihi)
      };
    }

    const siparisler = await Siparis.findAll({
      where: whereClause,
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: Kullanici,
          as: 'kullanici',
          attributes: ['id', 'kullanici_adi', 'ad_soyad']
        },
        {
          model: Musteri,
          as: 'musteri',
          attributes: ['id', 'ad_soyad', 'telefon']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.status(200).json(siparisler);
  } catch (error) {
    console.error('Siparişleri listelerken hata:', error);
    res.status(500).json({
      message: 'Siparişler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş detayını getir
 */
exports.getSiparisById = async (req, res) => {
  try {
    const { id } = req.params;

    const siparis = await Siparis.findByPk(id, {
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: Kullanici,
          as: 'kullanici',
          attributes: ['id', 'kullanici_adi', 'ad_soyad']
        },
        {
          model: Musteri,
          as: 'musteri',
          attributes: ['id', 'ad_soyad', 'telefon']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        }
      ]
    });

    if (!siparis) {
      return res.status(404).json({
        message: 'Sipariş bulunamadı'
      });
    }

    res.status(200).json(siparis);
  } catch (error) {
    console.error('Sipariş detayı alınırken hata:', error);
    res.status(500).json({
      message: 'Sipariş detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni sipariş oluştur
 */
exports.createSiparis = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { masa_id, musteri_id, urunler } = req.body;
    const kullanici_id = req.kullanici.id;  // JWT token'dan

    // Gerekli alanları kontrol et
    if (!masa_id || !urunler || !Array.isArray(urunler) || urunler.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message: 'Masa ID ve en az bir ürün zorunludur'
      });
    }

    // Masa var mı ve müsait mi kontrol et
    const masa = await Masa.findByPk(masa_id, { transaction: t });
    if (!masa) {
      await t.rollback();
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    // Siparişte istenen ürünleri kontrol et
    for (const urunItem of urunler) {
      const { urun_id, miktar } = urunItem;
      if (!urun_id || !miktar || miktar <= 0) {
        await t.rollback();
        return res.status(400).json({
          message: 'Geçersiz ürün bilgisi: Ürün ID ve miktar zorunludur ve miktar 0\'dan büyük olmalıdır'
        });
      }

      const urun = await Urun.findByPk(urun_id, { transaction: t });
      if (!urun) {
        await t.rollback();
        return res.status(404).json({
          message: `Ürün bulunamadı: ID ${urun_id}`
        });
      }

      if (!urun.stok_durumu) {
        await t.rollback();
        return res.status(400).json({
          message: `Ürün stokta yok: ${urun.ad}`
        });
      }
    }

    // Yeni sipariş oluştur
    const yeniSiparis = await Siparis.create(
      {
        masa_id,
        musteri_id: musteri_id || null,
        kullanici_id,
        durum: 'hazırlanıyor',
        toplam_tutar: 0,  // Başlangıçta 0, sonra güncellenecek
        olusturma_tarihi: new Date(),
        guncelleme_tarihi: new Date()
      },
      { transaction: t }
    );

    // Sipariş detaylarını oluştur ve toplam tutarı hesapla
    let toplamTutar = 0;
    const siparisDetaylari = [];

    for (const urunItem of urunler) {
      const { urun_id, miktar, notlar } = urunItem;
      
      // Ürün fiyatını al
      const urun = await Urun.findByPk(urun_id, { transaction: t });
      const birimFiyat = urun.fiyat;
      const urunToplamFiyat = birimFiyat * miktar;
      
      // Sipariş detayı oluştur
      const siparisDetay = await SiparisDetay.create(
        {
          siparis_id: yeniSiparis.id,
          urun_id,
          miktar,
          birim_fiyat: birimFiyat,
          toplam_fiyat: urunToplamFiyat,
          notlar: notlar || null
        },
        { transaction: t }
      );
      
      siparisDetaylari.push(siparisDetay);
      toplamTutar += urunToplamFiyat;
    }

    // Sipariş toplam tutarını güncelle
    await yeniSiparis.update(
      {
        toplam_tutar: toplamTutar
      },
      { transaction: t }
    );

    // Masayı dolu olarak işaretle
    await masa.update(
      {
        durum: 'dolu'
      },
      { transaction: t }
    );

    // İşlemleri tamamla
    await t.commit();

    // Socket.IO ile yeni sipariş bildirimi gönder (eğer mevcutsa)
    const io = req.app.get('io');
    if (io) {
      io.emit('yeni_siparis', {
        id: yeniSiparis.id,
        masa_no: masa.masa_no,
        toplam_tutar: toplamTutar
      });
    }

    // Detaylı sipariş bilgisini getir
    const siparis = await Siparis.findByPk(yeniSiparis.id, {
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: Kullanici,
          as: 'kullanici',
          attributes: ['id', 'kullanici_adi', 'ad_soyad']
        },
        {
          model: Musteri,
          as: 'musteri',
          attributes: ['id', 'ad_soyad', 'telefon']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        }
      ]
    });

    res.status(201).json(siparis);
  } catch (error) {
    await t.rollback();
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({
      message: 'Sipariş oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş güncelle
 */
exports.updateSiparis = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { masa_id, musteri_id, urunler } = req.body;

    // Siparişi bul
    const siparis = await Siparis.findByPk(id, {
      include: [
        {
          model: SiparisDetay,
          as: 'detaylar'
        }
      ],
      transaction: t
    });

    if (!siparis) {
      await t.rollback();
      return res.status(404).json({
        message: 'Sipariş bulunamadı'
      });
    }

    // Sipariş iptal edilmiş mi kontrol et
    if (siparis.durum === 'iptal') {
      await t.rollback();
      return res.status(400).json({
        message: 'İptal edilmiş sipariş güncellenemez'
      });
    }

    // Masa değiştiyse yeni masayı kontrol et
    if (masa_id && masa_id !== siparis.masa_id) {
      const yeniMasa = await Masa.findByPk(masa_id, { transaction: t });
      if (!yeniMasa) {
        await t.rollback();
        return res.status(404).json({
          message: 'Yeni masa bulunamadı'
        });
      }

      // Eski masayı boş olarak işaretle
      const eskiMasa = await Masa.findByPk(siparis.masa_id, { transaction: t });
      if (eskiMasa) {
        // Masada başka aktif sipariş var mı kontrol et
        const masadakiAktifSiparisSayisi = await Siparis.count({
          where: {
            masa_id: siparis.masa_id,
            id: { [Op.ne]: siparis.id },
            durum: { [Op.ne]: 'iptal' }
          },
          transaction: t
        });

        if (masadakiAktifSiparisSayisi === 0) {
          await eskiMasa.update({ durum: 'boş' }, { transaction: t });
        }
      }

      // Yeni masayı dolu olarak işaretle
      await yeniMasa.update({ durum: 'dolu' }, { transaction: t });
    }

    // Sipariş temel bilgilerini güncelle
    await siparis.update(
      {
        masa_id: masa_id || siparis.masa_id,
        musteri_id: musteri_id !== undefined ? musteri_id : siparis.musteri_id,
        guncelleme_tarihi: new Date()
      },
      { transaction: t }
    );

    // Ürünler değiştiyse güncelle
    if (urunler && Array.isArray(urunler) && urunler.length > 0) {
      // Mevcut sipariş detaylarını sil
      await SiparisDetay.destroy({
        where: { siparis_id: siparis.id },
        transaction: t
      });

      // Yeni sipariş detaylarını oluştur ve toplam tutarı hesapla
      let toplamTutar = 0;
      
      for (const urunItem of urunler) {
        const { urun_id, miktar, notlar } = urunItem;
        
        if (!urun_id || !miktar || miktar <= 0) {
          await t.rollback();
          return res.status(400).json({
            message: 'Geçersiz ürün bilgisi: Ürün ID ve miktar zorunludur ve miktar 0\'dan büyük olmalıdır'
          });
        }

        // Ürünü kontrol et
        const urun = await Urun.findByPk(urun_id, { transaction: t });
        if (!urun) {
          await t.rollback();
          return res.status(404).json({
            message: `Ürün bulunamadı: ID ${urun_id}`
          });
        }

        if (!urun.stok_durumu) {
          await t.rollback();
          return res.status(400).json({
            message: `Ürün stokta yok: ${urun.ad}`
          });
        }

        // Birim fiyat ve toplam fiyat hesapla
        const birimFiyat = urun.fiyat;
        const urunToplamFiyat = birimFiyat * miktar;
        
        // Sipariş detayı oluştur
        await SiparisDetay.create(
          {
            siparis_id: siparis.id,
            urun_id,
            miktar,
            birim_fiyat: birimFiyat,
            toplam_fiyat: urunToplamFiyat,
            notlar: notlar || null
          },
          { transaction: t }
        );
        
        toplamTutar += urunToplamFiyat;
      }

      // Sipariş toplam tutarını güncelle
      await siparis.update({ toplam_tutar: toplamTutar }, { transaction: t });
    }

    // İşlemleri tamamla
    await t.commit();

    // Socket.IO ile sipariş güncelleme bildirimi gönder
    const io = req.app.get('io');
    if (io) {
      io.emit('siparis_guncellendi', {
        id: siparis.id,
        masa_no: (await Masa.findByPk(siparis.masa_id)).masa_no,
        toplam_tutar: siparis.toplam_tutar
      });
    }

    // Güncellenmiş sipariş bilgisini getir
    const guncelSiparis = await Siparis.findByPk(siparis.id, {
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: Kullanici,
          as: 'kullanici',
          attributes: ['id', 'kullanici_adi', 'ad_soyad']
        },
        {
          model: Musteri,
          as: 'musteri',
          attributes: ['id', 'ad_soyad', 'telefon']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        }
      ]
    });

    res.status(200).json(guncelSiparis);
  } catch (error) {
    await t.rollback();
    console.error('Sipariş güncelleme hatası:', error);
    res.status(500).json({
      message: 'Sipariş güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş durumunu güncelle
 */
exports.updateSiparisDurum = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { durum } = req.body;

    // Durum kontrolü
    if (!durum || !['hazırlanıyor', 'tamamlandı', 'iptal'].includes(durum)) {
      await t.rollback();
      return res.status(400).json({
        message: 'Geçerli bir durum değeri girilmelidir (hazırlanıyor/tamamlandı/iptal)'
      });
    }

    // Siparişi bul
    const siparis = await Siparis.findByPk(id, { transaction: t });

    if (!siparis) {
      await t.rollback();
      return res.status(404).json({
        message: 'Sipariş bulunamadı'
      });
    }

    // İptal edilmiş sipariş tekrar aktif hale getirilemez
    if (siparis.durum === 'iptal' && durum !== 'iptal') {
      await t.rollback();
      return res.status(400).json({
        message: 'İptal edilmiş sipariş tekrar aktif hale getirilemez'
      });
    }

    // Sipariş iptal ediliyorsa masayı kontrol et
    if (durum === 'iptal' && siparis.durum !== 'iptal') {
      // Masadaki diğer aktif sipariş sayısını kontrol et
      const masadakiAktifSiparisSayisi = await Siparis.count({
        where: {
          masa_id: siparis.masa_id,
          id: { [Op.ne]: siparis.id },
          durum: { [Op.ne]: 'iptal' }
        },
        transaction: t
      });

      // Başka aktif sipariş yoksa masayı boş olarak işaretle
      if (masadakiAktifSiparisSayisi === 0) {
        const masa = await Masa.findByPk(siparis.masa_id, { transaction: t });
        if (masa) {
          await masa.update({ durum: 'boş' }, { transaction: t });
        }
      }
    }

    // Sipariş durumunu güncelle
    await siparis.update(
      {
        durum,
        guncelleme_tarihi: new Date()
      },
      { transaction: t }
    );

    // İşlemleri tamamla
    await t.commit();

    // Socket.IO ile sipariş durumu güncelleme bildirimi gönder
    const io = req.app.get('io');
    if (io) {
      io.emit('siparis_durumu_guncellendi', {
        id: siparis.id,
        durum: siparis.durum
      });
    }

    // Güncellenmiş sipariş bilgisini getir
    const guncelSiparis = await Siparis.findByPk(id, {
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        }
      ]
    });

    res.status(200).json(guncelSiparis);
  } catch (error) {
    await t.rollback();
    console.error('Sipariş durumu güncelleme hatası:', error);
    res.status(500).json({
      message: 'Sipariş durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Sipariş iptal et
 */
exports.deleteSiparis = async (req, res) => {
  // Siparişi iptal etmek için durumunu 'iptal' olarak güncelle
  req.body.durum = 'iptal';
  return this.updateSiparisDurum(req, res);
};

/**
 * Masa bazlı siparişleri getir
 */
exports.getSiparislerByMasa = async (req, res) => {
  try {
    const { masaId } = req.params;
    const { durum } = req.query;

    // Masayı kontrol et
    const masa = await Masa.findByPk(masaId);
    if (!masa) {
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    // Filtreleme için where koşulu
    let whereClause = { masa_id: masaId };
    if (durum) {
      whereClause.durum = durum;
    } else {
      // Varsayılan olarak iptal olmayan siparişleri getir
      whereClause.durum = { [Op.ne]: 'iptal' };
    }

    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: whereClause,
      include: [
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        },
        {
          model: Kullanici,
          as: 'kullanici',
          attributes: ['id', 'kullanici_adi', 'ad_soyad']
        },
        {
          model: Musteri,
          as: 'musteri',
          attributes: ['id', 'ad_soyad', 'telefon']
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.status(200).json(siparisler);
  } catch (error) {
    console.error('Masa siparişleri alınırken hata:', error);
    res.status(500).json({
      message: 'Masa siparişleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Aktif siparişleri getir
 */
exports.getAktifSiparisler = async (req, res) => {
  try {
    // Aktif siparişleri getir (hazırlanıyor durumdakiler)
    const siparisler = await Siparis.findAll({
      where: { durum: 'hazırlanıyor' },
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad']
            }
          ]
        }
      ],
      order: [['olusturma_tarihi', 'ASC']]
    });

    res.status(200).json(siparisler);
  } catch (error) {
    console.error('Aktif siparişler alınırken hata:', error);
    res.status(500).json({
      message: 'Aktif siparişler alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Tarih aralığına göre siparişleri getir
 */
exports.getSiparislerByTarih = async (req, res) => {
  try {
    const { baslangic, bitis } = req.params;
    
    if (!baslangic || !bitis) {
      return res.status(400).json({
        message: 'Başlangıç ve bitiş tarihleri gereklidir'
      });
    }

    // Tarih formatlarını düzelt
    const baslangicTarihi = new Date(baslangic);
    const bitisTarihi = new Date(bitis);
    
    // Bitiş tarihinin sonuna 23:59:59 ekle
    bitisTarihi.setHours(23, 59, 59, 999);

    // Tarihleri kontrol et
    if (isNaN(baslangicTarihi.getTime()) || isNaN(bitisTarihi.getTime())) {
      return res.status(400).json({
        message: 'Geçersiz tarih formatı. YYYY-MM-DD formatında tarih kullanın'
      });
    }

    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      },
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: Kullanici,
          as: 'kullanici',
          attributes: ['id', 'ad_soyad']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.status(200).json(siparisler);
  } catch (error) {
    console.error('Tarih aralığı siparişleri alınırken hata:', error);
    res.status(500).json({
      message: 'Tarih aralığı siparişleri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcı bazlı siparişleri getir
 */
exports.getSiparislerByKullanici = async (req, res) => {
  try {
    const { kullaniciId } = req.params;

    // Kullanıcıyı kontrol et
    const kullanici = await Kullanici.findByPk(kullaniciId);
    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: { kullanici_id: kullaniciId },
      include: [
        {
          model: Masa,
          as: 'masa',
          attributes: ['id', 'masa_no']
        },
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun',
              attributes: ['id', 'ad', 'fiyat']
            }
          ]
        }
      ],
      order: [['olusturma_tarihi', 'DESC']]
    });

    res.status(200).json(siparisler);
  } catch (error) {
    console.error('Kullanıcı siparişleri alınırken hata:', error);
    res.status(500).json({
      message: 'Kullanıcı siparişleri alınırken bir hata oluştu',
      error: error.message
    });
  }
}; 