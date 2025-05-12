const db = require('../models');
const Fatura = db.Fatura;
const Siparis = db.Siparis;
const Musteri = db.Musteri;
const SiparisDetay = db.SiparisDetay;
const Urun = db.Urun;
const { Op } = require('sequelize');

// Tüm faturaları getir (route'ta getAllFaturalar olarak belirtilmiş)
exports.getAllFaturalar = async (req, res) => {
  try {
    const tarihBaslangic = req.query.tarihBaslangic;
    const tarihBitis = req.query.tarihBitis;
    
    let whereKosulu = {};
    
    // Tarih filtresi varsa ekle
    if (tarihBaslangic && tarihBitis) {
      whereKosulu.faturaTarihi = {
        [Op.between]: [tarihBaslangic, tarihBitis]
      };
    } else if (tarihBaslangic) {
      whereKosulu.faturaTarihi = {
        [Op.gte]: tarihBaslangic
      };
    } else if (tarihBitis) {
      whereKosulu.faturaTarihi = {
        [Op.lte]: tarihBitis
      };
    }
    
    const faturalar = await Fatura.findAll({
      where: whereKosulu,
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { model: Musteri, as: 'musteri' }
          ]
        }
      ],
      order: [['faturaTarihi', 'DESC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Faturalar başarıyla getirildi",
      veri: faturalar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Faturalar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// ID'ye göre tek bir fatura getir (route'ta getFaturaById olarak belirtilmiş)
exports.getFaturaById = async (req, res) => {
  try {
    const fatura = await Fatura.findByPk(req.params.id, {
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { 
              model: SiparisDetay, 
              as: 'siparisDetaylari',
              include: [
                { model: Urun, as: 'urun' }
              ]
            },
            { model: Musteri, as: 'musteri' }
          ]
        }
      ]
    });
    
    if (!fatura) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Fatura bulunamadı"
      });
    }
    
    res.status(200).send({
      basarili: true,
      mesaj: "Fatura başarıyla getirildi",
      veri: fatura
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Fatura getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Yeni fatura oluştur (route'ta createFatura olarak belirtilmiş)
exports.createFatura = async (req, res) => {
  try {
    // Gerekli alanların kontrolü
    if (!req.body.siparisId) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Sipariş ID zorunludur."
      });
    }

    // Sipariş kontrolü
    const siparis = await Siparis.findByPk(req.body.siparisId, {
      include: [
        { 
          model: SiparisDetay, 
          as: 'detaylar',
          include: [
            { model: Urun, as: 'urun' }
          ]
        },
        { model: Musteri, as: 'musteri' }
      ]
    });

    if (!siparis) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Belirtilen sipariş bulunamadı."
      });
    }

    // Siparişin faturası var mı kontrol et
    const mevcutFatura = await Fatura.findOne({
      where: { siparis_id: req.body.siparisId }
    });

    if (mevcutFatura) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Bu sipariş için zaten bir fatura oluşturulmuş."
      });
    }

    // Toplam tutarı hesapla (eğer gönderilmemişse)
    let toplamTutar = req.body.toplamTutar;
    if (!toplamTutar) {
      toplamTutar = siparis.toplam_tutar;
    }

    // Fatura nesnesi oluştur
    const fatura = {
      siparis_id: req.body.siparisId,
      musteri_id: siparis.musteri_id,
      odeme_turu: req.body.odemeTuru || "nakit",
      toplam_tutar: toplamTutar,
      durum: req.body.faturaDurumu || "ödendi",
      olusturma_tarihi: new Date()
    };

    // Veritabanına kaydet
    const yeniFatura = await Fatura.create(fatura);
    
    // İlişkili sipariş bilgilerini içeren tam fatura bilgisini getir
    const tamFatura = await Fatura.findByPk(yeniFatura.id, {
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { 
              model: SiparisDetay, 
              as: 'detaylar',
              include: [
                { model: Urun, as: 'urun' }
              ]
            },
            { model: Musteri, as: 'musteri' }
          ]
        }
      ]
    });
    
    // Sipariş durumunu "tamamlandı" olarak güncelle
    await Siparis.update(
      { durum: "tamamlandı" },
      { where: { id: req.body.siparisId } }
    );
    
    res.status(201).send({
      basarili: true,
      mesaj: "Fatura başarıyla oluşturuldu",
      veri: tamFatura
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Fatura oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Fatura güncelle (route'ta updateFatura olarak belirtilmiş)
exports.updateFatura = async (req, res) => {
  try {
    const id = req.params.id;
    const fatura = await Fatura.findByPk(id);
    
    if (!fatura) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Güncellenecek fatura bulunamadı"
      });
    }
    
    // Güncelleme işlemi
    await Fatura.update(req.body, {
      where: { id: id }
    });
    
    // Güncellenmiş faturayı getir
    const guncelFatura = await Fatura.findByPk(id, {
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { 
              model: SiparisDetay, 
              as: 'siparisDetaylari',
              include: [
                { model: Urun, as: 'urun' }
              ]
            },
            { model: Musteri, as: 'musteri' }
          ]
        }
      ]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Fatura başarıyla güncellendi",
      veri: guncelFatura
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Fatura güncellenirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Fatura durumunu güncelle (route'ta updateFaturaDurum olarak belirtilmiş)
exports.updateFaturaDurum = async (req, res) => {
  try {
    const id = req.params.id;
    const { faturaDurumu } = req.body;
    
    if (!faturaDurumu) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Fatura durumu bilgisi zorunludur"
      });
    }
    
    const fatura = await Fatura.findByPk(id);
    
    if (!fatura) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Güncellenecek fatura bulunamadı"
      });
    }
    
    // Durumu güncelle
    await Fatura.update(
      { faturaDurumu },
      { where: { id: id } }
    );
    
    // Güncellenmiş faturayı getir
    const guncelFatura = await Fatura.findByPk(id, {
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { model: Musteri, as: 'musteri' }
          ]
        }
      ]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Fatura durumu başarıyla güncellendi",
      veri: guncelFatura
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Fatura durumu güncellenirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Fatura sil (route'ta deleteFatura olarak belirtilmiş)
exports.deleteFatura = async (req, res) => {
  try {
    const id = req.params.id;
    const fatura = await Fatura.findByPk(id);
    
    if (!fatura) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Silinecek fatura bulunamadı"
      });
    }
    
    await Fatura.destroy({
      where: { id: id }
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Fatura başarıyla silindi"
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Fatura silinirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Sipariş bazlı fatura getir (route'ta getFaturaBySiparis olarak belirtilmiş)
exports.getFaturaBySiparis = async (req, res) => {
  try {
    const siparisId = req.params.siparisId;
    
    if (!siparisId) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Sipariş ID zorunludur"
      });
    }
    
    const fatura = await Fatura.findOne({
      where: { siparisId: siparisId },
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { 
              model: SiparisDetay, 
              as: 'siparisDetaylari',
              include: [
                { model: Urun, as: 'urun' }
              ]
            },
            { model: Musteri, as: 'musteri' }
          ]
        }
      ]
    });
    
    if (!fatura) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Bu siparişe ait fatura bulunamadı"
      });
    }
    
    res.status(200).send({
      basarili: true,
      mesaj: "Fatura başarıyla getirildi",
      veri: fatura
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Fatura getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteri bazlı faturaları getir (route'ta getFaturalarByMusteri olarak belirtilmiş)
exports.getFaturalarByMusteri = async (req, res) => {
  try {
    const musteriId = req.params.musteriId;
    
    if (!musteriId) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Müşteri ID zorunludur"
      });
    }
    
    // Müşterinin siparişlerini bul
    const siparisler = await Siparis.findAll({
      where: { musteriId: musteriId },
      attributes: ['id']
    });
    
    if (siparisler.length === 0) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Bu müşteriye ait sipariş bulunamadı"
      });
    }
    
    const siparisIdleri = siparisler.map(siparis => siparis.id);
    
    // Sipariş ID'lerine göre faturaları getir
    const faturalar = await Fatura.findAll({
      where: { 
        siparisId: { 
          [Op.in]: siparisIdleri 
        } 
      },
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { model: Musteri, as: 'musteri' }
          ]
        }
      ],
      order: [['faturaTarihi', 'DESC']]
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Faturalar başarıyla getirildi",
      veri: faturalar
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Faturalar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Tarih aralığına göre faturaları getir (route'ta getFaturalarByTarih olarak belirtilmiş)
exports.getFaturalarByTarih = async (req, res) => {
  try {
    const { baslangic, bitis } = req.params;
    
    if (!baslangic || !bitis) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }

    const faturalar = await Fatura.findAll({
      where: {
        faturaTarihi: {
          [Op.between]: [baslangic, bitis]
        }
      },
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { model: Musteri, as: 'musteri' }
          ]
        }
      ],
      order: [['faturaTarihi', 'ASC']]
    });
    
    // Toplam, KDV ve net tutarlar
    const toplamBrutTutar = faturalar.reduce((total, fatura) => total + fatura.toplamTutar, 0);
    const toplamKdvTutari = faturalar.reduce((total, fatura) => total + fatura.kdvTutari, 0);
    const toplamNetTutar = toplamBrutTutar - toplamKdvTutari;
    
    res.status(200).send({
      basarili: true,
      mesaj: "Faturalar başarıyla getirildi",
      veri: {
        faturalar,
        ozet: {
          toplamFaturaSayisi: faturalar.length,
          toplamBrutTutar,
          toplamKdvTutari,
          toplamNetTutar
        }
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Faturalar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
};

// Ödeme türüne göre faturaları getir (route'ta getFaturalarByOdemeTuru olarak belirtilmiş)
exports.getFaturalarByOdemeTuru = async (req, res) => {
  try {
    const odemeTuru = req.params.odemeTuru;
    
    if (!odemeTuru) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Ödeme türü zorunludur"
      });
    }

    const faturalar = await Fatura.findAll({
      where: { 
        odemeTuru: odemeTuru 
      },
      include: [
        { 
          model: Siparis, 
          as: 'siparis',
          include: [
            { model: Musteri, as: 'musteri' }
          ]
        }
      ],
      order: [['faturaTarihi', 'DESC']]
    });
    
    // Toplam tutar
    const toplamTutar = faturalar.reduce((total, fatura) => total + fatura.toplamTutar, 0);
    
    res.status(200).send({
      basarili: true,
      mesaj: "Faturalar başarıyla getirildi",
      veri: {
        faturalar,
        ozet: {
          toplamFaturaSayisi: faturalar.length,
          toplamTutar
        }
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Faturalar getirilirken bir hata oluştu",
      hata: err.message
    });
  }
}; 