-- Restoran Yönetim Sistemi için başlangıç veritabanı script'i
-- Bu dosya Docker container'ı ilk çalıştırıldığında otomatik olarak çalışır

-- Veritabanını seç
USE restoran_db;

-- Karakter seti ayarla
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;

-- Zaman dilimi ayarla
SET time_zone = '+03:00';

-- Başlangıç verilerini eklemek için kullanılabilir
-- Sequelize modelleri otomatik olarak tabloları oluşturacak

-- Örnek admin kullanıcısı için SQL (isteğe bağlı)
-- INSERT INTO kullanicis (ad, soyad, email, sifre, rol, createdAt, updatedAt) 
-- VALUES ('Admin', 'User', 'admin@restoran.com', '$2a$10$hashed_password', 'admin', NOW(), NOW());

-- Örnek kategoriler
-- INSERT INTO kategoris (ad, aciklama, createdAt, updatedAt) 
-- VALUES 
-- ('Ana Yemekler', 'Et ve tavuk yemekleri', NOW(), NOW()),
-- ('İçecekler', 'Soğuk ve sıcak içecekler', NOW(), NOW()),
-- ('Tatlılar', 'Ev yapımı tatlılar', NOW(), NOW()); 