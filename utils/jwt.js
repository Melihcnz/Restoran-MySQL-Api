const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtariniz_buraya';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Kullanıcı için JWT token oluştur
 * @param {Object} kullanici - Kullanıcı verisi
 * @returns {String} JWT token
 */
exports.generateToken = (kullanici) => {
  return jwt.sign(
    {
      id: kullanici.id,
      kullanici_adi: kullanici.kullanici_adi,
      yetki: kullanici.yetki
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
};

/**
 * JWT token doğrulama
 * @param {String} token - JWT token
 * @returns {Object|Boolean} Doğrulanmış kullanıcı bilgisi veya false
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return false;
  }
}; 