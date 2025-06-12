#!/bin/bash

# Restoran Yönetim Sistemi - Hızlı Kurulum Script'i
# Bu script VPS'te projeyi tek komutla çalıştırır

set -e

echo "🚀 Restoran Yönetim Sistemi Kurulumu Başlıyor..."

# 1. .env dosyasını oluştur
if [ ! -f .env ]; then
    echo "📝 .env dosyası oluşturuluyor..."
    cp env.example .env
    echo "✅ .env dosyası oluşturuldu"
else
    echo "✅ .env dosyası zaten mevcut"
fi

# 2. Gerekli dizinleri oluştur
echo "📁 Dizinler oluşturuluyor..."
mkdir -p uploads
mkdir -p logs/{mysql,api,phpmyadmin,backup}
chmod -R 755 uploads logs
echo "✅ Dizinler oluşturuldu"

# 3. Docker kontrol
if ! command -v docker &> /dev/null; then
    echo "❌ Docker yüklü değil! Lütfen Docker'ı yükleyin."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose yüklü değil! Lütfen Docker Compose'u yükleyin."
    exit 1
fi

echo "✅ Docker ve Docker Compose hazır"

# 4. Eski container'ları temizle
echo "🧹 Eski container'lar temizleniyor..."
docker-compose down 2>/dev/null || true

# 5. Container'ları başlat
echo "🐳 Docker container'ları başlatılıyor..."
docker-compose up -d

# 6. Servislerin hazır olmasını bekle
echo "⏳ Servisler hazırlanıyor..."
sleep 10

# 7. Durumu kontrol et
echo "🔍 Servis durumları kontrol ediliyor..."
docker-compose ps

# 8. Bağlantıları test et
echo "🌐 Bağlantılar test ediliyor..."

# MySQL bağlantısını test et
for i in {1..30}; do
    if docker exec restoran_mysql mysqladmin ping -h localhost --silent; then
        echo "✅ MySQL hazır"
        break
    fi
    echo "⏳ MySQL bekleniyor... ($i/30)"
    sleep 2
done

# API bağlantısını test et
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null; then
        echo "✅ API hazır"
        break
    fi
    echo "⏳ API bekleniyor... ($i/30)"
    sleep 2
done

echo ""
echo "🎉 KURULUM TAMAMLANDI!"
echo ""
echo "📱 Erişim Adresleri:"
echo "   • API: http://$(curl -s ifconfig.me):3001"
echo "   • phpMyAdmin: http://$(curl -s ifconfig.me):8080"
echo ""
echo "🔑 phpMyAdmin Giriş:"
echo "   • Kullanıcı: restoran_user"
echo "   • Şifre: restoran123"
echo ""
echo "📋 Yararlı Komutlar:"
echo "   • Logları gör: docker-compose logs"
echo "   • Durumu kontrol et: docker-compose ps"
echo "   • Yeniden başlat: docker-compose restart"
echo "   • Durdur: docker-compose down"
echo "" 