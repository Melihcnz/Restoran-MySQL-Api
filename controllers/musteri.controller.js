const db = require('../models');
const Musteri = db.Musteri;
const Siparis = db.Siparis;
const Rezervasyon = db.Rezervasyon;
const Fatura = db.Fatura;
const { Op } = require('sequelize');

// Tüm müşterileri getir (metot ismi route ile eşleşmeli)
exports.getAllMusteriler = async (req, res) => {
  try {
    const musteriler = await Musteri.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşteriler başarıyla getirildi",
      veri: musteriler
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteriler getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// ID'ye göre tek bir müşteri getir (metot ismi route ile eşleşmeli)
exports.getMusteriById = async (req, res) => {
  try {
    const musteri = await Musteri.findByPk(req.params.id);
    
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Müşteri bulunamadı"
      });
    }
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşteri başarıyla getirildi",
      veri: musteri
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Yeni müşteri oluştur (metot ismi route ile eşleşmeli)
exports.createMusteri = async (req, res) => {
  try {
    // Gerekli alanların kontrolü
    if (!req.body.ad || !req.body.telefon) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Ad ve telefon bilgileri zorunludur."
      });
    }

    // Müşteri nesnesini oluştur
    const musteri = {
      ad_soyad: `${req.body.ad} ${req.body.soyad || ''}`.trim(),
      telefon: req.body.telefon,
      email: req.body.email || "",
      adres: req.body.adres || ""
      // olusturma_tarihi varsayılan değer olarak model tarafında atanacak
    };

    // Postman'da gelen notlar alanını işleme
    if (req.body.notlar) {
      console.log("Not bilgisi alındı fakat modelde bu alan bulunmadığı için kaydedilmedi: ", req.body.notlar);
    }

    // Veritabanına kaydet
    const yeniMusteri = await Musteri.create(musteri);
    
    res.status(201).send({
      basarili: true,
      mesaj: "Müşteri başarıyla oluşturuldu",
      veri: yeniMusteri
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteri güncelle (metot ismi route ile eşleşmeli)
exports.updateMusteri = async (req, res) => {
  try {
    const id = req.params.id;
    const musteri = await Musteri.findByPk(id);
    
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Güncellenecek müşteri bulunamadı"
      });
    }
    
    // Güncelleme işlemi
    await Musteri.update(req.body, {
      where: { id: id }
    });
    
    // Güncellenmiş müşteriyi getir
    const guncelMusteri = await Musteri.findByPk(id);
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşteri başarıyla güncellendi",
      veri: guncelMusteri
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri güncellenirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteri sil (metot ismi route ile eşleşmeli)
exports.deleteMusteri = async (req, res) => {
  try {
    const id = req.params.id;
    const musteri = await Musteri.findByPk(id);
    
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Silinecek müşteri bulunamadı"
      });
    }
    
    await Musteri.destroy({
      where: { id: id }
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşteri başarıyla silindi"
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri silinirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteriye ait siparişleri getir
exports.getMusteriSiparisler = async (req, res) => {
  try {
    const musteriId = req.params.id;
    
    // Müşteri var mı kontrol et
    const musteri = await Musteri.findByPk(musteriId);
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Müşteri bulunamadı"
      });
    }
    
    // Müşterinin siparişlerini getir
    const siparisler = await Siparis.findAll({
      where: { musteriId: musteriId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşterinin siparişleri başarıyla getirildi",
      veri: siparisler
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri siparişleri getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteriye ait rezervasyonları getir
exports.getMusteriRezervasyonlar = async (req, res) => {
  try {
    const musteriId = req.params.id;
    
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
      where: { musteriId: musteriId },
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

// Müşteriye ait faturaları getir
exports.getMusteriFaturalar = async (req, res) => {
  try {
    const musteriId = req.params.id;
    
    // Müşteri var mı kontrol et
    const musteri = await Musteri.findByPk(musteriId);
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Müşteri bulunamadı"
      });
    }
    
    // Müşterinin siparişlerine ait faturaları getir
    const siparisler = await Siparis.findAll({
      where: { musteriId: musteriId },
      attributes: ['id']
    });
    
    const siparisIdleri = siparisler.map(siparis => siparis.id);
    
    const faturalar = await Fatura.findAll({
      where: { 
        siparisId: { 
          [Op.in]: siparisIdleri 
        } 
      },
      order: [['faturaTarihi', 'DESC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşterinin faturaları başarıyla getirildi",
      veri: faturalar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri faturaları getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Telefon numarasına göre müşteri ara
exports.getMusteriByTelefon = async (req, res) => {
  try {
    const telefon = req.params.telefon;
    
    const musteri = await Musteri.findOne({
      where: { telefon: telefon }
    });
    
    if (!musteri) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Bu telefon numarasına sahip müşteri bulunamadı"
      });
    }
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşteri başarıyla getirildi",
      veri: musteri
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri getirilirken bir hata oluştu",
      hata: err.message
    });
  }
}; 