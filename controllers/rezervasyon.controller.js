const db = require('../models');
const Rezervasyon = db.Rezervasyon;
const Masa = db.Masa;
const Musteri = db.Musteri;
const { Op } = require('sequelize');

// Tüm rezervasyonları getir (route'ta getAllRezervasyonlar olarak belirtilmiş)
exports.getAllRezervasyonlar = async (req, res) => {
  try {
    const rezervasyonlar = await Rezervasyon.findAll({
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ],
      order: [['tarih', 'ASC'], ['saat', 'ASC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyonlar başarıyla getirildi",
      veri: rezervasyonlar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyonlar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// ID'ye göre tek bir rezervasyon getir (route'ta getRezervasyonById olarak belirtilmiş)
exports.getRezervasyonById = async (req, res) => {
  try {
    const rezervasyon = await Rezervasyon.findByPk(req.params.id, {
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ]
    });
    
    if (!rezervasyon) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Rezervasyon bulunamadı"
      });
    }
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyon başarıyla getirildi",
      veri: rezervasyon
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyon getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Yeni rezervasyon oluştur (route'ta createRezervasyon olarak belirtilmiş)
exports.createRezervasyon = async (req, res) => {
  try {
    // Gerekli alanların kontrolü
    if (!req.body.masaId || !req.body.tarih || !req.body.saat || !req.body.kisiSayisi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Masa ID, tarih, saat ve kişi sayısı bilgileri zorunludur."
      });
    }

    // Masa kontrolü
    const masa = await Masa.findByPk(req.body.masaId);
    if (!masa) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Belirtilen masa bulunamadı."
      });
    }

    // Müşteri kontrolü (eğer müşteri ID gönderilmişse)
    if (req.body.musteriId) {
      const musteri = await Musteri.findByPk(req.body.musteriId);
      if (!musteri) {
        return res.status(404).send({
          basarili: false,
          mesaj: "Belirtilen müşteri bulunamadı."
        });
      }
    }

    // Rezervasyon nesnesi oluştur - model alanları ile uyumlu olacak şekilde
    const rezervasyon = {
      masa_id: req.body.masaId,
      musteri_id: req.body.musteriId,
      tarih: req.body.tarih,
      saat: req.body.saat,
      kisi_sayisi: req.body.kisiSayisi,
      notlar: req.body.notlar || "",
      durum: req.body.durum || "onaylandı"
    };

    // Aynı masa, tarih ve saatte başka rezervasyon var mı kontrolü
    const mevcutRezervasyon = await Rezervasyon.findOne({
      where: {
        masa_id: rezervasyon.masa_id,
        tarih: rezervasyon.tarih,
        saat: rezervasyon.saat,
        durum: {
          [Op.notIn]: ['iptal']
        }
      }
    });

    if (mevcutRezervasyon) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Bu masa için belirtilen tarih ve saatte zaten bir rezervasyon mevcut."
      });
    }

    // Veritabanına kaydet
    const yeniRezervasyon = await Rezervasyon.create(rezervasyon);
    
    // İlişkili masa ve müşteri bilgilerini içeren tam rezervasyon bilgisini getir
    const tamRezervasyon = await Rezervasyon.findByPk(yeniRezervasyon.id, {
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ]
    });
    
    res.status(201).send({
      basarili: true,
      mesaj: "Rezervasyon başarıyla oluşturuldu",
      veri: tamRezervasyon
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyon oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Rezervasyon güncelle (route'ta updateRezervasyon olarak belirtilmiş)
exports.updateRezervasyon = async (req, res) => {
  try {
    const id = req.params.id;
    const rezervasyon = await Rezervasyon.findByPk(id);
    
    if (!rezervasyon) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Güncellenecek rezervasyon bulunamadı"
      });
    }
    
    // Masa değiştiyse kontrol et
    if (req.body.masaId && req.body.masaId !== rezervasyon.masa_id) {
      const masa = await Masa.findByPk(req.body.masaId);
      if (!masa) {
        return res.status(404).send({
          basarili: false,
          mesaj: "Belirtilen masa bulunamadı."
        });
      }
    }
    
    // Aynı masa, tarih ve saatte başka rezervasyon var mı kontrolü
    // (sadece tarih, saat veya masa değiştiyse kontrol et)
    if (
      req.body.masaId || 
      req.body.tarih || 
      req.body.saat
    ) {
      const masa_id = req.body.masaId || rezervasyon.masa_id;
      const tarih = req.body.tarih || rezervasyon.tarih;
      const saat = req.body.saat || rezervasyon.saat;
      
      const mevcutRezervasyon = await Rezervasyon.findOne({
        where: {
          masa_id: masa_id,
          tarih: tarih,
          saat: saat,
          id: { [Op.ne]: id },
          durum: {
            [Op.notIn]: ['iptal']
          }
        }
      });

      if (mevcutRezervasyon) {
        return res.status(400).send({
          basarili: false,
          mesaj: "Bu masa için belirtilen tarih ve saatte zaten bir rezervasyon mevcut."
        });
      }
    }
    
    // Veritabanı alanlarına uygun olarak request verilerini dönüştürme
    const guncelVeri = {
      ...req.body
    };
    
    // Alanları veritabanı alan isimleriyle eşleştir
    if (req.body.masaId !== undefined) {
      guncelVeri.masa_id = req.body.masaId;
      delete guncelVeri.masaId;
    }
    
    if (req.body.musteriId !== undefined) {
      guncelVeri.musteri_id = req.body.musteriId;
      delete guncelVeri.musteriId;
    }
    
    if (req.body.kisiSayisi !== undefined) {
      guncelVeri.kisi_sayisi = req.body.kisiSayisi;
      delete guncelVeri.kisiSayisi;
    }
    
    // Güncelleme işlemi
    await Rezervasyon.update(guncelVeri, {
      where: { id: id }
    });
    
    // Güncellenmiş rezervasyonu getir
    const guncelRezervasyon = await Rezervasyon.findByPk(id, {
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyon başarıyla güncellendi",
      veri: guncelRezervasyon
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyon güncellenirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Rezervasyon durumunu güncelle (route'ta updateRezervasyonDurum olarak belirtilmiş)
exports.updateRezervasyonDurum = async (req, res) => {
  try {
    const id = req.params.id;
    const { durum } = req.body;
    
    if (!durum) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Durum bilgisi zorunludur"
      });
    }
    
    const rezervasyon = await Rezervasyon.findByPk(id);
    
    if (!rezervasyon) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Güncellenecek rezervasyon bulunamadı"
      });
    }
    
    // Durumu güncelle
    await Rezervasyon.update(
      { durum },
      { where: { id: id } }
    );
    
    // Güncellenmiş rezervasyonu getir
    const guncelRezervasyon = await Rezervasyon.findByPk(id, {
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyon durumu başarıyla güncellendi",
      veri: guncelRezervasyon
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyon durumu güncellenirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Rezervasyon sil (route'ta deleteRezervasyon olarak belirtilmiş)
exports.deleteRezervasyon = async (req, res) => {
  try {
    const id = req.params.id;
    const rezervasyon = await Rezervasyon.findByPk(id);
    
    if (!rezervasyon) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Silinecek rezervasyon bulunamadı"
      });
    }
    
    await Rezervasyon.destroy({
      where: { id: id }
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyon başarıyla silindi"
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyon silinirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Belirli tarihteki rezervasyonları getir (route'ta getRezervasyonlarByTarih olarak belirtilmiş)
exports.getRezervasyonlarByTarih = async (req, res) => {
  try {
    const tarih = req.params.tarih;
    
    if (!tarih) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Tarih bilgisi zorunludur"
      });
    }

    const rezervasyonlar = await Rezervasyon.findAll({
      where: {
        tarih: tarih
      },
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ],
      order: [['saat', 'ASC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyonlar başarıyla getirildi",
      veri: rezervasyonlar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyonlar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Tarih aralığına göre rezervasyonları getir
exports.getRezervasyonlarByTarihAralik = async (req, res) => {
  try {
    const { baslangic, bitis } = req.query;
    
    if (!baslangic || !bitis) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihleri gereklidir"
      });
    }
    
    const rezervasyonlar = await Rezervasyon.findAll({
      where: {
        tarih: {
          [Op.between]: [baslangic, bitis]
        }
      },
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ],
      order: [['tarih', 'ASC'], ['saat', 'ASC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Rezervasyonlar başarıyla getirildi",
      veri: rezervasyonlar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Rezervasyonlar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Masa bazlı rezervasyonları getir
exports.getRezervasyonlarByMasa = async (req, res) => {
  try {
    const masaId = req.params.masaId;
    
    // Masa var mı kontrol et
    const masa = await Masa.findByPk(masaId);
    if (!masa) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Masa bulunamadı"
      });
    }
    
    // Masanın rezervasyonlarını getir
    const rezervasyonlar = await Rezervasyon.findAll({
      where: {
        masa_id: masaId
      },
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ],
      order: [['tarih', 'ASC'], ['saat', 'ASC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Masanın rezervasyonları başarıyla getirildi",
      veri: rezervasyonlar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Masa rezervasyonları getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteri bazlı rezervasyonları getir
exports.getRezervasyonlarByMusteri = async (req, res) => {
  try {
    const musteriId = req.params.musteriId;
    
    // Müşteri var mı kontrol et
    const musteri = await Musteri.findByPk(musteriId);
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Müşteri bulunamadı"
      });
    }
    
    // Müşterinin rezervasyonlarını getir
    const rezervasyonlar = await Rezervasyon.findAll({
      where: {
        musteri_id: musteriId
      },
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' }
      ],
      order: [['tarih', 'DESC'], ['saat', 'ASC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşterinin rezervasyonları başarıyla getirildi",
      veri: rezervasyonlar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri rezervasyonları getirilirken bir hata oluştu",
      hata: err.message
    });
  }
}; 