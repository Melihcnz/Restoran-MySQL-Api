const db = require('../models');
const Siparis = db.Siparis;
const SiparisDetay = db.SiparisDetay;
const Urun = db.Urun;
const Kategori = db.Kategori;
const Masa = db.Masa;
const Musteri = db.Musteri;
const Fatura = db.Fatura;
const Kullanici = db.Kullanici;
const { Op } = require('sequelize');
const sequelize = db.sequelize;

// Satış raporu (route'ta getSatisRaporu olarak belirtilmiş)
exports.getSatisRaporu = async (req, res) => {
  try {
    const { baslangicTarihi, bitisTarihi } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangic, bitis]
        }
      },
      include: [
        { 
          model: SiparisDetay, 
          as: 'detaylar',
          include: [
            { 
              model: Urun, 
              as: 'urun',
              include: [
                { model: Kategori, as: 'kategori' }
              ]
            }
          ]
        }
      ]
    });
    
    // Faturaları getir
    const faturalar = await Fatura.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangic, bitis]
        }
      }
    });
    
    // Günlük ciro verilerini hesapla
    const gunlukCiro = {};
    faturalar.forEach(fatura => {
      const tarih = fatura.olusturma_tarihi.toISOString().split('T')[0];
      if (!gunlukCiro[tarih]) {
        gunlukCiro[tarih] = 0;
      }
      gunlukCiro[tarih] += fatura.toplam_tutar;
    });
    
    // Günlük ciro verilerini diziye çevirme
    const ciroVerileri = Object.keys(gunlukCiro).map(tarih => ({
      tarih,
      ciro: gunlukCiro[tarih]
    })).sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    
    // Özet bilgileri hesapla
    const toplamSiparisSayisi = siparisler.length;
    const toplamSiparisTutari = siparisler.reduce((toplam, siparis) => toplam + siparis.toplam_tutar, 0);
    const toplamFaturaSayisi = faturalar.length;
    const toplamFaturaTutari = faturalar.reduce((toplam, fatura) => toplam + fatura.toplam_tutar, 0);
    
    // Ödeme türüne göre grupla
    const odemeTurleri = {};
    faturalar.forEach(fatura => {
      const tur = fatura.odeme_turu;
      if (!odemeTurleri[tur]) {
        odemeTurleri[tur] = {
          sayi: 0,
          tutar: 0
        };
      }
      odemeTurleri[tur].sayi++;
      odemeTurleri[tur].tutar += fatura.toplam_tutar;
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Satış raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi,
        bitisTarihi,
        ozet: {
          toplamSiparisSayisi,
          toplamSiparisTutari,
          toplamFaturaSayisi,
          toplamFaturaTutari
        },
        gunlukCiroVerileri: ciroVerileri,
        odemeTurleri
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Ürün bazlı rapor (route'ta getUrunRaporu olarak belirtilmiş)
exports.getUrunRaporu = async (req, res) => {
  try {
    const { baslangicTarihi, bitisTarihi, kategoriId } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Kategori koşulu
    let kategoriKosulu = {};
    if (kategoriId) {
      kategoriKosulu = { kategori_id: kategoriId };
    }
    
    // Sipariş detaylarını hesapla (SQL ile)
    const [urunSatislari] = await sequelize.query(`
      SELECT 
        u.id AS urunId, 
        u.ad AS urunAdi, 
        k.ad AS kategoriAdi,
        SUM(sd.miktar) AS toplamMiktar, 
        SUM(sd.toplam_fiyat) AS toplamTutar
      FROM siparis_detay sd
      JOIN urunler u ON sd.urun_id = u.id
      JOIN siparisler s ON sd.siparis_id = s.id
      LEFT JOIN kategoriler k ON u.kategori_id = k.id
      WHERE s.olusturma_tarihi BETWEEN :baslangic AND :bitis
      ${kategoriId ? 'AND u.kategori_id = :kategoriId' : ''}
      GROUP BY u.id, u.ad, k.ad
      ORDER BY toplamMiktar DESC
    `, {
      replacements: { 
        baslangic, 
        bitis,
        kategoriId
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Ürün raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi,
        bitisTarihi,
        urunSatislari
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Ürün raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Günlük satış raporu
exports.getGunlukRapor = async (req, res) => {
  try {
    const tarih = req.query.tarih || new Date().toISOString().split('T')[0];
    
    // Belirtilen günün başlangıç ve bitiş tarihleri
    const baslangicTarihi = new Date(tarih);
    const bitisTarihi = new Date(tarih);
    bitisTarihi.setHours(23, 59, 59, 999);
    
    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      },
      include: [
        { model: Masa, as: 'masa' },
        { model: Musteri, as: 'musteri' },
        { 
          model: SiparisDetay, 
          as: 'detaylar',
          include: [
            { 
              model: Urun, 
              as: 'urun',
              include: [
                { model: Kategori, as: 'kategori' }
              ]
            }
          ]
        }
      ]
    });
    
    // Faturaları getir
    const faturalar = await Fatura.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      },
      include: [
        { model: Siparis, as: 'siparis' }
      ]
    });
    
    // Özet bilgileri hesapla
    const toplamSiparisSayisi = siparisler.length;
    const toplamSiparisTutari = siparisler.reduce((toplam, siparis) => toplam + siparis.toplam_tutar, 0);
    const toplamFaturaSayisi = faturalar.length;
    const toplamFaturaTutari = faturalar.reduce((toplam, fatura) => toplam + fatura.toplam_tutar, 0);
    
    // Ödeme türüne göre grupla
    const odemeTurleri = {};
    faturalar.forEach(fatura => {
      const tur = fatura.odeme_turu;
      if (!odemeTurleri[tur]) {
        odemeTurleri[tur] = {
          sayi: 0,
          tutar: 0
        };
      }
      odemeTurleri[tur].sayi++;
      odemeTurleri[tur].tutar += fatura.toplam_tutar;
    });
    
    // En çok satılan ürünleri bul
    const urunSatislari = {};
    siparisler.forEach(siparis => {
      siparis.detaylar.forEach(detay => {
        const urunId = detay.urunId;
        const urunAdi = detay.urun.ad;
        const miktar = detay.miktar;
        const fiyat = detay.fiyat;
        const tutar = detay.tutar;
        
        if (!urunSatislari[urunId]) {
          urunSatislari[urunId] = {
            urunId,
            urunAdi,
            toplamMiktar: 0,
            toplamTutar: 0,
            kategori: detay.urun.kategori ? detay.urun.kategori.ad : 'Kategorisiz'
          };
        }
        
        urunSatislari[urunId].toplamMiktar += miktar;
        urunSatislari[urunId].toplamTutar += tutar;
      });
    });
    
    // Ürün satışlarını diziye çevir ve sırala
    const enCokSatilanUrunler = Object.values(urunSatislari).sort((a, b) => b.toplamMiktar - a.toplamMiktar);
    
    // Kategoriye göre satışları hesapla
    const kategoriSatislari = {};
    siparisler.forEach(siparis => {
      siparis.detaylar.forEach(detay => {
        const kategori = detay.urun.kategori ? detay.urun.kategori.ad : 'Kategorisiz';
        const tutar = detay.tutar;
        
        if (!kategoriSatislari[kategori]) {
          kategoriSatislari[kategori] = {
            kategori,
            toplamTutar: 0
          };
        }
        
        kategoriSatislari[kategori].toplamTutar += tutar;
      });
    });
    
    // Kategori satışlarını diziye çevir ve sırala
    const kategoriRaporu = Object.values(kategoriSatislari).sort((a, b) => b.toplamTutar - a.toplamTutar);
    
    res.status(200).send({
      basarili: true,
      mesaj: "Günlük satış raporu başarıyla oluşturuldu",
      veri: {
        tarih,
        ozet: {
          toplamSiparisSayisi,
          toplamSiparisTutari,
          toplamFaturaSayisi,
          toplamFaturaTutari
        },
        odemeTurleri,
        enCokSatilanUrunler: enCokSatilanUrunler.slice(0, 10), // İlk 10 ürün
        kategoriRaporu
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Günlük satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Tarih aralığı satış raporu
exports.getTarihAraligiRaporu = async (req, res) => {
  try {
    const { baslangic, bitis } = req.params;
    
    if (!baslangic || !bitis) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangicTarihi = new Date(baslangic);
    const bitisTarihi = new Date(bitis);
    bitisTarihi.setHours(23, 59, 59, 999);
    
    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: {
        createdAt: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      },
      include: [
        { 
          model: SiparisDetay, 
          as: 'siparisDetaylari',
          include: [
            { 
              model: Urun, 
              as: 'urun',
              include: [
                { model: Kategori, as: 'kategori' }
              ]
            }
          ]
        }
      ]
    });
    
    // Faturaları getir
    const faturalar = await Fatura.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      }
    });
    
    // Günlük ciro verilerini hesapla
    const gunlukCiro = {};
    faturalar.forEach(fatura => {
      const tarih = fatura.olusturma_tarihi.toISOString().split('T')[0];
      if (!gunlukCiro[tarih]) {
        gunlukCiro[tarih] = 0;
      }
      gunlukCiro[tarih] += fatura.toplam_tutar;
    });
    
    // Günlük ciro verilerini diziye çevirme
    const ciroVerileri = Object.keys(gunlukCiro).map(tarih => ({
      tarih,
      ciro: gunlukCiro[tarih]
    })).sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    
    // Özet bilgileri hesapla
    const toplamSiparisSayisi = siparisler.length;
    const toplamSiparisTutari = siparisler.reduce((toplam, siparis) => toplam + siparis.toplam_tutar, 0);
    const toplamFaturaSayisi = faturalar.length;
    const toplamFaturaTutari = faturalar.reduce((toplam, fatura) => toplam + fatura.toplam_tutar, 0);
    
    // Ödeme türüne göre grupla
    const odemeTurleri = {};
    faturalar.forEach(fatura => {
      const tur = fatura.odeme_turu;
      if (!odemeTurleri[tur]) {
        odemeTurleri[tur] = {
          sayi: 0,
          tutar: 0
        };
      }
      odemeTurleri[tur].sayi++;
      odemeTurleri[tur].tutar += fatura.toplam_tutar;
    });
    
    // En çok satılan ürünleri hesapla
    const urunSatislari = {};
    siparisler.forEach(siparis => {
      siparis.siparisDetaylari.forEach(detay => {
        const urunId = detay.urunId;
        const urunAdi = detay.urun.ad;
        const miktar = detay.miktar;
        const tutar = detay.tutar;
        
        if (!urunSatislari[urunId]) {
          urunSatislari[urunId] = {
            urunId,
            urunAdi,
            toplamMiktar: 0,
            toplamTutar: 0,
            kategori: detay.urun.kategori ? detay.urun.kategori.ad : 'Kategorisiz'
          };
        }
        
        urunSatislari[urunId].toplamMiktar += miktar;
        urunSatislari[urunId].toplamTutar += tutar;
      });
    });
    
    // Ürün satışlarını diziye çevir ve sırala
    const enCokSatilanUrunler = Object.values(urunSatislari).sort((a, b) => b.toplamMiktar - a.toplamMiktar);
    
    // Kategoriye göre satışları hesapla
    const kategoriSatislari = {};
    siparisler.forEach(siparis => {
      siparis.siparisDetaylari.forEach(detay => {
        const kategori = detay.urun.kategori ? detay.urun.kategori.ad : 'Kategorisiz';
        const tutar = detay.tutar;
        
        if (!kategoriSatislari[kategori]) {
          kategoriSatislari[kategori] = {
            kategori,
            toplamTutar: 0
          };
        }
        
        kategoriSatislari[kategori].toplamTutar += tutar;
      });
    });
    
    // Kategori satışlarını diziye çevir ve sırala
    const kategoriRaporu = Object.values(kategoriSatislari).sort((a, b) => b.toplamTutar - a.toplamTutar);
    
    res.status(200).send({
      basarili: true,
      mesaj: "Tarih aralığı satış raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi: baslangic,
        bitisTarihi: bitis,
        ozet: {
          toplamSiparisSayisi,
          toplamSiparisTutari,
          toplamFaturaSayisi,
          toplamFaturaTutari
        },
        gunlukCiroVerileri: ciroVerileri,
        odemeTurleri,
        enCokSatilanUrunler: enCokSatilanUrunler.slice(0, 10), // İlk 10 ürün
        kategoriRaporu
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Tarih aralığı satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Ürün satış raporu
exports.urunSatisRaporu = async (req, res) => {
  try {
    const { baslangicTarihi, bitisTarihi, kategoriId } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Kategori koşulu
    let kategoriKosulu = {};
    if (kategoriId) {
      kategoriKosulu = { kategori_id: kategoriId };
    }
    
    // Sipariş detaylarını hesapla (SQL ile)
    const [urunSatislari] = await sequelize.query(`
      SELECT 
        u.id AS urunId, 
        u.ad AS urunAdi, 
        k.ad AS kategoriAdi,
        SUM(sd.miktar) AS toplamMiktar, 
        SUM(sd.toplam_fiyat) AS toplamTutar
      FROM siparis_detay sd
      JOIN urunler u ON sd.urun_id = u.id
      JOIN siparisler s ON sd.siparis_id = s.id
      LEFT JOIN kategoriler k ON u.kategori_id = k.id
      WHERE s.created_at BETWEEN :baslangic AND :bitis
      ${kategoriId ? 'AND u.kategori_id = :kategoriId' : ''}
      GROUP BY u.id, u.ad, k.ad
      ORDER BY toplamMiktar DESC
    `, {
      replacements: { 
        baslangic, 
        bitis,
        kategoriId
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Ürün satış raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi,
        bitisTarihi,
        urunSatislari
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Ürün satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Kategori satış raporu
exports.getKategoriRaporu = async (req, res) => {
  try {
    const { kategoriId } = req.params;
    const { baslangicTarihi, bitisTarihi } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Kategori var mı kontrol et
    if (kategoriId) {
      const kategori = await Kategori.findByPk(kategoriId);
      if (!kategori) {
        return res.status(404).send({
          basarili: false,
          mesaj: "Kategori bulunamadı"
        });
      }
    }
    
    // Kategori satışlarını hesapla (SQL ile)
    const [kategoriSatislari] = await sequelize.query(`
      SELECT 
        u.id AS urunId, 
        u.ad AS urunAdi, 
        SUM(sd.miktar) AS toplamMiktar, 
        SUM(sd.toplam_fiyat) AS toplamTutar
      FROM siparis_detay sd
      JOIN urunler u ON sd.urun_id = u.id
      JOIN siparisler s ON sd.siparis_id = s.id
      WHERE s.created_at BETWEEN :baslangic AND :bitis
      AND u.kategori_id = :kategoriId
      GROUP BY u.id, u.ad
      ORDER BY toplamMiktar DESC
    `, {
      replacements: { 
        baslangic, 
        bitis,
        kategoriId
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Toplam kategori satışı
    const toplamKategoriSatisi = kategoriSatislari.reduce((toplam, urun) => toplam + parseFloat(urun.toplamTutar), 0);
    
    res.status(200).send({
      basarili: true,
      mesaj: "Kategori satış raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi,
        bitisTarihi,
        toplamKategoriSatisi,
        urunler: kategoriSatislari
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Kategori satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Masa satış raporu
exports.masaSatisRaporu = async (req, res) => {
  try {
    const { baslangicTarihi, bitisTarihi } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Masa satışlarını hesapla (SQL ile)
    const [masaSatislari] = await sequelize.query(`
      SELECT 
        m.id AS masaId, 
        m.masaNo AS masaNo, 
        COUNT(DISTINCT s.id) AS siparisSayisi,
        AVG(s.toplam_tutar) AS ortalamaHesap,
        MAX(s.toplam_tutar) AS maksimumHesap,
        MIN(s.toplam_tutar) AS minimumHesap,
        SUM(s.toplam_tutar) AS toplamCiro
      FROM siparisler s
      JOIN masalar m ON s.masaId = m.id
      WHERE s.created_at BETWEEN :baslangic AND :bitis
      GROUP BY m.id, m.masaNo
      ORDER BY toplamCiro DESC
    `, {
      replacements: { baslangic, bitis },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Masa satış raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi,
        bitisTarihi,
        masaSatislari
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Masa satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Müşteri bazlı rapor
exports.getMusteriRaporu = async (req, res) => {
  try {
    const { baslangicTarihi, bitisTarihi } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Müşteri bazlı siparişleri getir
    const [musteriSatislari] = await sequelize.query(`
      SELECT 
        m.id AS musteriId, 
        m.ad_soyad AS musteriAdi, 
        m.telefon AS musteriTelefon,
        COUNT(s.id) AS siparisSayisi,
        SUM(s.toplam_tutar) AS toplamHarcama,
        AVG(s.toplam_tutar) AS ortalamaHarcama,
        MAX(s.toplam_tutar) AS enYuksekHarcama,
        MIN(s.toplam_tutar) AS enDusukHarcama
      FROM siparisler s
      JOIN musteriler m ON s.musteriId = m.id
      WHERE s.created_at BETWEEN :baslangic AND :bitis
      GROUP BY m.id, m.ad_soyad, m.telefon
      ORDER BY toplamHarcama DESC
    `, {
      replacements: { baslangic, bitis },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).send({
      basarili: true,
      mesaj: "Müşteri raporu başarıyla oluşturuldu",
      veri: {
        baslangicTarihi,
        bitisTarihi,
        musteriSatislari
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Müşteri raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Aylık satış raporu
exports.getAylikRapor = async (req, res) => {
  try {
    const { ay, yil } = req.params;
    
    if (!ay || !yil) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Ay ve yıl bilgisi zorunludur"
      });
    }
    
    // Ayın başlangıç ve bitiş tarihleri
    const ayNumara = parseInt(ay);
    const yilNumara = parseInt(yil);
    
    if (ayNumara < 1 || ayNumara > 12 || isNaN(ayNumara) || isNaN(yilNumara)) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Geçersiz ay veya yıl değeri"
      });
    }
    
    const baslangicTarihi = new Date(yilNumara, ayNumara - 1, 1);
    const bitisTarihi = new Date(yilNumara, ayNumara, 0);
    bitisTarihi.setHours(23, 59, 59, 999);
    
    // Siparişleri getir
    const siparisler = await Siparis.findAll({
      where: {
        createdAt: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      },
      include: [
        { 
          model: SiparisDetay, 
          as: 'siparisDetaylari',
          include: [
            { 
              model: Urun, 
              as: 'urun',
              include: [
                { model: Kategori, as: 'kategori' }
              ]
            }
          ]
        }
      ]
    });
    
    // Faturaları getir
    const faturalar = await Fatura.findAll({
      where: {
        olusturma_tarihi: {
          [Op.between]: [baslangicTarihi, bitisTarihi]
        }
      }
    });
    
    // Günlük ciro verilerini hesapla
    const gunlukCiro = {};
    faturalar.forEach(fatura => {
      const tarih = fatura.olusturma_tarihi.toISOString().split('T')[0];
      if (!gunlukCiro[tarih]) {
        gunlukCiro[tarih] = 0;
      }
      gunlukCiro[tarih] += fatura.toplam_tutar;
    });
    
    // Günlük ciro verilerini diziye çevirme
    const ciroVerileri = Object.keys(gunlukCiro).map(tarih => ({
      tarih,
      ciro: gunlukCiro[tarih]
    })).sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    
    // Özet bilgileri hesapla
    const toplamSiparisSayisi = siparisler.length;
    const toplamSiparisTutari = siparisler.reduce((toplam, siparis) => toplam + siparis.toplam_tutar, 0);
    const toplamFaturaSayisi = faturalar.length;
    const toplamFaturaTutari = faturalar.reduce((toplam, fatura) => toplam + fatura.toplam_tutar, 0);
    
    // Ödeme türüne göre grupla
    const odemeTurleri = {};
    faturalar.forEach(fatura => {
      const tur = fatura.odeme_turu;
      if (!odemeTurleri[tur]) {
        odemeTurleri[tur] = {
          sayi: 0,
          tutar: 0
        };
      }
      odemeTurleri[tur].sayi++;
      odemeTurleri[tur].tutar += fatura.toplam_tutar;
    });
    
    // Kategoriye göre satışları hesapla
    const kategoriSatislari = {};
    siparisler.forEach(siparis => {
      siparis.siparisDetaylari.forEach(detay => {
        const kategori = detay.urun.kategori ? detay.urun.kategori.ad : 'Kategorisiz';
        const tutar = detay.tutar;
        
        if (!kategoriSatislari[kategori]) {
          kategoriSatislari[kategori] = {
            kategori,
            toplamTutar: 0
          };
        }
        
        kategoriSatislari[kategori].toplamTutar += tutar;
      });
    });
    
    // Kategori satışlarını diziye çevir ve sırala
    const kategoriRaporu = Object.values(kategoriSatislari).sort((a, b) => b.toplamTutar - a.toplamTutar);
    
    const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    
    res.status(200).send({
      basarili: true,
      mesaj: `${aylar[ayNumara - 1]} ${yilNumara} satış raporu başarıyla oluşturuldu`,
      veri: {
        ay: ayNumara,
        yil: yilNumara,
        ayAdi: aylar[ayNumara - 1],
        ozet: {
          toplamSiparisSayisi,
          toplamSiparisTutari,
          toplamFaturaSayisi,
          toplamFaturaTutari,
          gunlukOrtalamaCiro: toplamFaturaTutari / ciroVerileri.length || 0
        },
        gunlukCiroVerileri: ciroVerileri,
        odemeTurleri,
        kategoriRaporu
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Aylık satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Yıllık satış raporu
exports.getYillikRapor = async (req, res) => {
  try {
    const { yil } = req.params;
    
    if (!yil) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Yıl bilgisi zorunludur"
      });
    }
    
    // Yılın başlangıç ve bitiş tarihleri
    const yilNumara = parseInt(yil);
    
    if (isNaN(yilNumara)) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Geçersiz yıl değeri"
      });
    }
    
    const baslangicTarihi = new Date(yilNumara, 0, 1);
    const bitisTarihi = new Date(yilNumara, 11, 31);
    bitisTarihi.setHours(23, 59, 59, 999);
    
    // Aylık ciro verilerini getir (SQL ile)
    const [aylikCiroVerileri] = await sequelize.query(`
      SELECT 
        MONTH(f.olusturma_tarihi) AS ay,
        SUM(f.toplam_tutar) AS ciro
      FROM faturalar f
      WHERE f.olusturma_tarihi BETWEEN :baslangic AND :bitis
      GROUP BY MONTH(f.olusturma_tarihi)
      ORDER BY ay ASC
    `, {
      replacements: { 
        baslangic: baslangicTarihi,
        bitis: bitisTarihi
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Kategoriye göre yıllık satışları getir
    const [kategoriSatislari] = await sequelize.query(`
      SELECT 
        k.id AS kategoriId, 
        k.ad AS kategoriAdi, 
        COUNT(DISTINCT sd.id) AS siparisSayisi,
        SUM(sd.miktar) AS toplamMiktar, 
        SUM(sd.toplam_fiyat) AS toplamTutar
      FROM siparis_detay sd
      JOIN urunler u ON sd.urun_id = u.id
      JOIN siparisler s ON sd.siparis_id = s.id
      LEFT JOIN kategoriler k ON u.kategori_id = k.id
      WHERE s.created_at BETWEEN :baslangic AND :bitis
      GROUP BY k.id, k.ad
      ORDER BY toplamTutar DESC
    `, {
      replacements: { baslangic: baslangicTarihi, bitis: bitisTarihi },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Ödeme türüne göre yıllık satışları getir
    const [odemeTurleri] = await sequelize.query(`
      SELECT 
        f.odeme_turu,
        COUNT(f.id) AS faturaSayisi,
        SUM(f.toplam_tutar) AS toplamTutar
      FROM faturalar f
      WHERE f.olusturma_tarihi BETWEEN :baslangic AND :bitis
      GROUP BY f.odeme_turu
      ORDER BY toplamTutar DESC
    `, {
      replacements: { baslangic: baslangicTarihi, bitis: bitisTarihi },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Toplam özet bilgileri getir
    const [ozet] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT s.id) AS siparisSayisi,
        SUM(s.toplam_tutar) AS siparisTutari,
        COUNT(DISTINCT f.id) AS faturaSayisi,
        SUM(f.toplam_tutar) AS faturaTutari
      FROM siparisler s
      LEFT JOIN faturalar f ON f.siparis_id = s.id
      WHERE s.created_at BETWEEN :baslangic AND :bitis
    `, {
      replacements: { baslangic: baslangicTarihi, bitis: bitisTarihi },
      type: sequelize.QueryTypes.SELECT
    });
    
    const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    
    // Aylık ciro verilerini düzenle
    const aylikCiro = [];
    for (let i = 1; i <= 12; i++) {
      const ayVeri = aylikCiroVerileri.find(veri => veri.ay === i);
      aylikCiro.push({
        ay: i,
        ayAdi: aylar[i - 1],
        ciro: ayVeri ? parseFloat(ayVeri.ciro) : 0
      });
    }
    
    res.status(200).send({
      basarili: true,
      mesaj: `${yil} yılı satış raporu başarıyla oluşturuldu`,
      veri: {
        yil: yilNumara,
        ozet: ozet[0] || {
          siparisSayisi: 0,
          siparisTutari: 0,
          faturaSayisi: 0,
          faturaTutari: 0
        },
        aylikCiro,
        odemeTurleri,
        kategoriSatislari
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Yıllık satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
};

// Kullanıcı bazlı satış raporu
exports.getKullaniciRaporu = async (req, res) => {
  try {
    const { kullaniciId } = req.params;
    const { baslangicTarihi, bitisTarihi } = req.query;
    
    if (!baslangicTarihi || !bitisTarihi) {
      return res.status(400).send({
        basarili: false,
        mesaj: "Başlangıç ve bitiş tarihi zorunludur"
      });
    }
    
    // Kullanıcıyı kontrol et
    const kullanici = await Kullanici.findByPk(kullaniciId);
    if (!kullanici) {
      return res.status(404).send({
        basarili: false,
        mesaj: "Kullanıcı bulunamadı"
      });
    }
    
    // Tarih aralığı başlangıç ve bitiş
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    bitis.setHours(23, 59, 59, 999);
    
    // Kullanıcının siparişlerini getir
    const siparisler = await Siparis.findAll({
      where: {
        kullaniciId,
        createdAt: {
          [Op.between]: [baslangic, bitis]
        }
      },
      include: [
        { model: Masa, as: 'masa' },
        { 
          model: SiparisDetay, 
          as: 'siparisDetaylari',
          include: [
            { 
              model: Urun, 
              as: 'urun',
              include: [
                { model: Kategori, as: 'kategori' }
              ]
            }
          ]
        }
      ]
    });
    
    // Kullanıcının toplam ve günlük satışlarını hesapla
    const gunlukSatislar = {};
    let toplamSiparisTutari = 0;
    
    siparisler.forEach(siparis => {
      const tarih = siparis.createdAt.toISOString().split('T')[0];
      if (!gunlukSatislar[tarih]) {
        gunlukSatislar[tarih] = {
          tarih,
          siparisSayisi: 0,
          toplamTutar: 0
        };
      }
      
      gunlukSatislar[tarih].siparisSayisi++;
      gunlukSatislar[tarih].toplamTutar += siparis.toplam_tutar;
      toplamSiparisTutari += siparis.toplam_tutar;
    });
    
    // Günlük satışları diziye çevir ve sırala
    const gunlukSatisVerileri = Object.values(gunlukSatislar).sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    
    res.status(200).send({
      basarili: true,
      mesaj: "Kullanıcı satış raporu başarıyla oluşturuldu",
      veri: {
        kullanici: {
          id: kullanici.id,
          kullaniciAdi: kullanici.kullaniciAdi,
          adSoyad: kullanici.adSoyad
        },
        baslangicTarihi,
        bitisTarihi,
        ozet: {
          toplamSiparisSayisi: siparisler.length,
          toplamSiparisTutari,
          gunlukOrtalama: siparisler.length > 0 ? toplamSiparisTutari / gunlukSatisVerileri.length : 0
        },
        gunlukSatisVerileri
      }
    });
  } catch (err) {
    res.status(500).send({
      basarili: false,
      mesaj: "Kullanıcı satış raporu oluşturulurken bir hata oluştu",
      hata: err.message
    });
  }
}; 