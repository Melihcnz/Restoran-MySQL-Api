const db = require('../models');
const Masa = db.Masa;
const Siparis = db.Siparis;
const SiparisDetay = db.SiparisDetay;
const Urun = db.Urun;
const { Op } = require('sequelize');

/**
 * Tüm masaları listele
 */
exports.getAllMasalar = async (req, res) => {
  try {
    const masalar = await Masa.findAll({
      order: [['masa_no', 'ASC']]
    });

    res.status(200).json(masalar);
  } catch (error) {
    console.error('Masaları listelerken hata:', error);
    res.status(500).json({
      message: 'Masalar listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Masa detayını getir
 */
exports.getMasaById = async (req, res) => {
  try {
    const { id } = req.params;

    const masa = await Masa.findByPk(id);

    if (!masa) {
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    res.status(200).json(masa);
  } catch (error) {
    console.error('Masa detayı alınırken hata:', error);
    res.status(500).json({
      message: 'Masa detayı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni masa ekle
 */
exports.createMasa = async (req, res) => {
  try {
    const { masa_no, kapasite, konum } = req.body;

    // Masa numarası kontrolü
    if (!masa_no) {
      return res.status(400).json({
        message: 'Masa numarası zorunludur'
      });
    }

    // Masa numarası benzersiz mi?
    const existingMasa = await Masa.findOne({
      where: { masa_no }
    });

    if (existingMasa) {
      return res.status(400).json({
        message: 'Bu masa numarası zaten kullanılıyor'
      });
    }

    // Yeni masa oluştur
    const yeniMasa = await Masa.create({
      masa_no,
      durum: 'boş',
      kapasite: kapasite || 4,
      konum: konum || 'salon',
      olusturma_tarihi: new Date()
    });

    res.status(201).json(yeniMasa);
  } catch (error) {
    console.error('Masa oluşturma hatası:', error);
    res.status(500).json({
      message: 'Masa oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Masa güncelle
 */
exports.updateMasa = async (req, res) => {
  try {
    const { id } = req.params;
    const { masa_no, kapasite, konum } = req.body;

    // Masayı bul
    const masa = await Masa.findByPk(id);

    if (!masa) {
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    // Masa numarası değiştiriliyorsa benzersiz mi kontrol et
    if (masa_no && masa_no !== masa.masa_no) {
      const existingMasa = await Masa.findOne({
        where: {
          masa_no,
          id: { [Op.ne]: id }
        }
      });

      if (existingMasa) {
        return res.status(400).json({
          message: 'Bu masa numarası zaten kullanılıyor'
        });
      }
    }

    // Masayı güncelle
    await masa.update({
      masa_no: masa_no || masa.masa_no,
      kapasite: kapasite || masa.kapasite,
      konum: konum || masa.konum
    });

    res.status(200).json(masa);
  } catch (error) {
    console.error('Masa güncelleme hatası:', error);
    res.status(500).json({
      message: 'Masa güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Masa durumunu güncelle
 */
exports.updateMasaDurum = async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;

    // Durum kontrolü
    if (!durum || !['boş', 'dolu'].includes(durum)) {
      return res.status(400).json({
        message: 'Geçerli bir durum değeri girilmelidir (boş/dolu)'
      });
    }

    // Masayı bul
    const masa = await Masa.findByPk(id);

    if (!masa) {
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    // Masayı güncelle
    await masa.update({ durum });

    // Socket.IO ile masa durumu güncelleme emiti yapılabilir
    // req.app.get('io').emit('masa_guncellendi', masa);

    res.status(200).json(masa);
  } catch (error) {
    console.error('Masa durumu güncelleme hatası:', error);
    res.status(500).json({
      message: 'Masa durumu güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Masa sil
 */
exports.deleteMasa = async (req, res) => {
  try {
    const { id } = req.params;

    // Masayı bul
    const masa = await Masa.findByPk(id);

    if (!masa) {
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    // Masaya bağlı aktif sipariş var mı kontrol et
    const aktifSiparis = await Siparis.findOne({
      where: {
        masa_id: id,
        durum: { [Op.ne]: 'iptal' }
      }
    });

    if (aktifSiparis) {
      return res.status(400).json({
        message: 'Masaya ait aktif siparişler olduğu için masa silinemez'
      });
    }

    // Masayı sil
    await masa.destroy();

    res.status(200).json({
      message: 'Masa başarıyla silindi'
    });
  } catch (error) {
    console.error('Masa silme hatası:', error);
    res.status(500).json({
      message: 'Masa silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Masa siparişlerini getir
 */
exports.getMasaSiparisler = async (req, res) => {
  try {
    const { id } = req.params;

    // Masayı kontrol et
    const masa = await Masa.findByPk(id);

    if (!masa) {
      return res.status(404).json({
        message: 'Masa bulunamadı'
      });
    }

    // Masanın aktif siparişlerini getir
    const siparisler = await Siparis.findAll({
      where: {
        masa_id: id,
        durum: { [Op.ne]: 'iptal' }
      },
      include: [
        {
          model: SiparisDetay,
          as: 'detaylar',
          include: [
            {
              model: Urun,
              as: 'urun'
            }
          ]
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