const jwtUtils = require('../utils/jwt');

/**
 * JWT token doğrulama middleware
 */
exports.verifyToken = (req, res, next) => {
  // Token'ı al (header'dan veya query'den)
  const token = req.headers['x-access-token'] || req.headers['authorization'];

  // Token yoksa hata döndür
  if (!token) {
    return res.status(403).json({
      message: 'Token sağlanmadı!'
    });
  }

  // Bearer formatını temizle
  const tokenValue = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  // Token'ı doğrula
  const decoded = jwtUtils.verifyToken(tokenValue);
  if (!decoded) {
    return res.status(401).json({
      message: 'Yetkisiz! Geçersiz token.'
    });
  }

  // Doğrulanmış kullanıcı bilgisini request'e ekle
  req.kullanici = decoded;
  next();
};

/**
 * Admin yetkisi kontrolü
 */
exports.isAdmin = (req, res, next) => {
  if (req.kullanici && req.kullanici.yetki === 'admin') {
    next();
    return;
  }

  res.status(403).json({
    message: 'Bu işlem için admin yetkisi gereklidir!'
  });
};

/**
 * Garson yetkisi kontrolü
 */
exports.isGarson = (req, res, next) => {
  if (req.kullanici && (req.kullanici.yetki === 'garson' || req.kullanici.yetki === 'admin')) {
    next();
    return;
  }

  res.status(403).json({
    message: 'Bu işlem için garson yetkisi gereklidir!'
  });
};

/**
 * Kasiyer yetkisi kontrolü
 */
exports.isKasiyer = (req, res, next) => {
  if (req.kullanici && (req.kullanici.yetki === 'kasiyer' || req.kullanici.yetki === 'admin')) {
    next();
    return;
  }

  res.status(403).json({
    message: 'Bu işlem için kasiyer yetkisi gereklidir!'
  });
}; 