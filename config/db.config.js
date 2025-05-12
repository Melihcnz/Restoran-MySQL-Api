require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'şifreniz',
  database: process.env.DB_NAME || 'restoran_db',
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
}; 