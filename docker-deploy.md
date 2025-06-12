# Restoran Yönetim Sistemi - VPS Docker Deployment

Bu dokümanda projenizi VPS sunucunuza Docker ile nasıl yükleyeceğiniz açıklanmıştır.

## Gereksinimler

- VPS sunucunuzda Docker ve Docker Compose yüklü olmalı
- Git yüklü olmalı
- En az 2GB RAM (önerilen 4GB)
- En az 10GB disk alanı

## 1. VPS Sunucunuza Bağlanın

```bash
ssh root@sunucu_ip_adresi
```

## 2. Docker ve Docker Compose Kurulumu (Eğer yoksa)

### Docker Kurulumu:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
```

### Docker Compose Kurulumu:
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## 3. Projeyi Klonlayın

```bash
git clone <projenizin-git-url>
cd Restoran-MySQL-Api
```

## 4. Çevre Değişkenlerini Ayarlayın

```bash
cp env.example .env
nano .env
```

`.env` dosyasında şu değerleri düzenleyin:
- `JWT_SECRET`: Güçlü bir secret key belirleyin
- `DB_PASSWORD`: Güçlü bir veritabanı şifresi belirleyin
- `DB_ROOT_PASSWORD`: MySQL root şifresini belirleyin

## 5. Upload Klasörünü Oluşturun

```bash
mkdir -p uploads
chmod 755 uploads
```

## 6. Uygulamayı Başlatın

```bash
docker-compose up -d
```

## 7. Servisleri Kontrol Edin

```bash
docker-compose ps
docker-compose logs
```

## Erişim Bilgileri

- **API**: http://sunucu_ip:3001
- **phpMyAdmin**: http://sunucu_ip:8080
- **MySQL**: sunucu_ip:3306

### phpMyAdmin Giriş Bilgileri:
- **Kullanıcı**: restoran_user (veya .env dosyasındaki DB_USER)
- **Şifre**: restoran123 (veya .env dosyasındaki DB_PASSWORD)

## Güvenlik Önerileri

1. **Firewall Ayarları**:
```bash
ufw allow 22    # SSH
ufw allow 3001  # API
ufw allow 8080  # phpMyAdmin
ufw enable
```

2. **Nginx Reverse Proxy** (Önerilen):
Domain ile erişim için Nginx kurabilirsiniz.

3. **SSL Sertifikası**:
Let's Encrypt ile ücretsiz SSL sertifikası alabilirsiniz.

## Yararlı Komutlar

```bash
# Logları görüntüle
docker-compose logs -f

# Servisleri yeniden başlat
docker-compose restart

# Servisleri durdur
docker-compose down

# Veritabanı yedekle
docker exec restoran_mysql mysqldump -u root -p restoran_db > backup.sql

# Veritabanını geri yükle
docker exec -i restoran_mysql mysql -u root -p restoran_db < backup.sql
```

## Sorun Giderme

1. **Port çakışması**: Başka bir servis aynı portu kullanıyorsa docker-compose.yml'deki port numaralarını değiştirin.

2. **Memory hatası**: VPS'inizin RAM'i yetersizse MySQL için memory ayarlarını düşürün.

3. **Bağlantı sorunu**: Firewall ayarlarını kontrol edin.

## Güncelleme

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
``` 