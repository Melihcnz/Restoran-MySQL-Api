const db = require('../models');
const Kullanici = db.Kullanici;
const jwtUtils = require('../utils/jwt');

/**
 * Kullanıcı girişi
 */
exports.login = async (req, res) => {
  try {
    const { kullanici_adi, sifre } = req.body;

    // Kullanıcı adı/şifre kontrolü
    if (!kullanici_adi || !sifre) {
      return res.status(400).json({
        message: 'Kullanıcı adı ve şifre gereklidir!'
      });
    }

    // Kullanıcıyı bul
    const kullanici = await Kullanici.findOne({
      where: { kullanici_adi }
    });

    // Kullanıcı bulunamadı
    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı!'
      });
    }

    // Şifre doğrulama
    const sifreGecerli = await kullanici.sifreDogrula(sifre);
    if (!sifreGecerli) {
      return res.status(401).json({
        message: 'Geçersiz şifre!'
      });
    }

    // JWT token oluştur
    const token = jwtUtils.generateToken(kullanici);

    res.status(200).json({
      id: kullanici.id,
      kullanici_adi: kullanici.kullanici_adi,
      ad_soyad: kullanici.ad_soyad,
      yetki: kullanici.yetki,
      token
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({
      message: 'Giriş sırasında bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcı çıkışı
 */
exports.logout = (req, res) => {
  // JWT token stateless olduğu için client tarafında token'ı silmek yeterli
  // Burada ek bir işlem gerekirse (örn. token blacklist) ileride eklenebilir
  res.status(200).json({
    message: 'Başarıyla çıkış yapıldı'
  });
};

/**
 * Kullanıcı bilgilerini getir
 */
exports.getMe = async (req, res) => {
  try {
    const kullaniciId = req.kullanici.id;

    const kullanici = await Kullanici.findByPk(kullaniciId, {
      attributes: { exclude: ['sifre'] } // Şifreyi hariç tut
    });

    if (!kullanici) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.status(200).json(kullanici);
  } catch (error) {
    console.error('Kullanıcı bilgileri hatası:', error);
    res.status(500).json({
      message: 'Kullanıcı bilgileri alınırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcı kaydı
 */
exports.register = async (req, res) => {
  try {
    const { kullanici_adi, sifre, ad_soyad, email, telefon } = req.body;

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

    // Yeni kullanıcı oluştur - varsayılan olarak garson yetkisiyle
    const yeniKullanici = await Kullanici.create({
      kullanici_adi,
      sifre,
      ad_soyad,
      yetki: 'garson', // Varsayılan yetki
      email,
      telefon,
      olusturma_tarihi: new Date()
    });

    // JWT token oluştur
    const token = jwtUtils.generateToken(yeniKullanici);

    // Şifreyi hariç tut
    const kullaniciData = yeniKullanici.toJSON();
    delete kullaniciData.sifre;

    res.status(201).json({
      ...kullaniciData,
      token
    });
  } catch (error) {
    console.error('Kullanıcı kaydı hatası:', error);
    res.status(500).json({
      message: 'Kullanıcı kaydı sırasında bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Admin kullanıcısı oluştur
 */
exports.registerAdmin = async (req, res) => {
  try {
    const { kullanici_adi, sifre, ad_soyad, email, telefon, admin_kod } = req.body;

    // Admin kod kontrolü - güvenlik önlemi olarak
    if (!admin_kod || admin_kod !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({
        message: 'Geçersiz admin kayıt kodu'
      });
    }

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

    // Yeni admin kullanıcısı oluştur
    const yeniKullanici = await Kullanici.create({
      kullanici_adi,
      sifre,
      ad_soyad,
      yetki: 'admin', // Admin yetkisi
      email,
      telefon,
      olusturma_tarihi: new Date()
    });

    // JWT token oluştur
    const token = jwtUtils.generateToken(yeniKullanici);

    // Şifreyi hariç tut
    const kullaniciData = yeniKullanici.toJSON();
    delete kullaniciData.sifre;

    res.status(201).json({
      ...kullaniciData,
      token
    });
  } catch (error) {
    console.error('Admin kaydı hatası:', error);
    res.status(500).json({
      message: 'Admin kaydı sırasında bir hata oluştu',
      error: error.message
    });
  }
}; 