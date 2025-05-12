const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./models');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: process.env.FILE_UPLOAD_LIMIT || '5mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.FILE_UPLOAD_LIMIT || '5mb' }));

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 15 dakikalık periyotta maksimum 100 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', apiLimiter);

// Socket.IO
require('./sockets/index')(io);

// Rotalar
const authRoutes = require('./routes/auth.routes');
const kullaniciRoutes = require('./routes/kullanici.routes');
const masaRoutes = require('./routes/masa.routes');
const kategoriRoutes = require('./routes/kategori.routes');
const urunRoutes = require('./routes/urun.routes');
const siparisRoutes = require('./routes/siparis.routes');
const musteriRoutes = require('./routes/musteri.routes');
const rezervasyonRoutes = require('./routes/rezervasyon.routes');
const faturaRoutes = require('./routes/fatura.routes');
const raporRoutes = require('./routes/rapor.routes');

app.use('/api/auth', authRoutes);
app.use('/api/kullanicilar', kullaniciRoutes);
app.use('/api/masalar', masaRoutes);
app.use('/api/kategoriler', kategoriRoutes);
app.use('/api/urunler', urunRoutes);
app.use('/api/siparisler', siparisRoutes);
app.use('/api/musteriler', musteriRoutes);
app.use('/api/rezervasyonlar', rezervasyonRoutes);
app.use('/api/faturalar', faturaRoutes);
app.use('/api/raporlar', raporRoutes);

// Kök rota
app.get('/', (req, res) => {
  res.json({ message: 'Restoran Yönetim Sistemi API' });
});

// 404 hatası
app.use((req, res) => {
  res.status(404).json({ message: 'İstenen endpoint bulunamadı' });
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// Sunucuyu başlatma
const PORT = process.env.PORT || 3001;

// Senkronize veritabanı ve sunucuyu başlat
db.sequelize.sync({ alter: process.env.NODE_ENV === 'development' }).then(() => {
  console.log('MySQL veritabanına bağlantı başarılı!');
  server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  });
}).catch(err => {
  console.error('Veritabanı bağlantısında hata:', err);
}); 