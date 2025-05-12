# Restoran Yönetim Sistemi Backend

Bu proje, bir restoran yönetim sistemi için Node.js ve MySQL tabanlı bir backend API sunmaktadır.

## Teknolojiler

- Node.js (v16.x önerilir)
- Express.js (v4.18.x)
- MySQL (v8.0.x)
- Sequelize ORM (v6.x)
- JWT Kimlik Doğrulama
- Socket.IO (Gerçek Zamanlı İletişim)
- Bcrypt (Şifre Hashleme)

## Kurulum

### Gereksinimler

- Node.js (>= 14.x)
- MySQL (>= 5.7)

### Adımlar

1. Projeyi klonlayın:
```
git clone https://github.com/Melihcnz/restoran-yonetim-sistemi.git
cd restoran-yonetim-sistemi/backend
```

2. Bağımlılıkları yükleyin:
```
npm install
```

3. MySQL veritabanı oluşturun:
```sql
CREATE DATABASE restoran_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. `.env` dosyasını oluşturun (örnek):
```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=şifreniz
DB_NAME=restoran_db
DB_PORT=3306

JWT_SECRET=gizli_anahtariniz_buraya
JWT_EXPIRES_IN=24h

FILE_UPLOAD_LIMIT=5242880
```

5. Uygulamayı başlatın:
```
npm start
```

Geliştirme modunda başlatmak için:
```
npm run dev
```

## API Endpoints

API dokümantasyonuna ve tüm endpoint'lerin listesine buradan ulaşabilirsiniz:

### Kimlik Doğrulama
- POST /api/auth/login - Kullanıcı girişi
- POST /api/auth/register - Kullanıcı kaydı
- POST /api/auth/register-admin - Admin kullanıcı kaydı (Sadece admin yetkisiyle)
- POST /api/auth/logout - Çıkış
- GET /api/auth/me - Kullanıcı bilgilerini getir

### Kullanıcılar
- GET /api/kullanicilar - Tüm kullanıcıları listele
- GET /api/kullanicilar/:id - Kullanıcı detayını getir
- POST /api/kullanicilar - Yeni kullanıcı ekle
- PUT /api/kullanicilar/:id - Kullanıcı güncelle
- DELETE /api/kullanicilar/:id - Kullanıcı sil
- PUT /api/kullanicilar/:id/sifre - Şifre güncelle

### Masalar
- GET /api/masalar - Tüm masaları listele
- GET /api/masalar/:id - Masa detayını getir
- POST /api/masalar - Yeni masa ekle
- PUT /api/masalar/:id - Masa bilgilerini güncelle
- PUT /api/masalar/:id/durum - Masa durumu güncelle
- DELETE /api/masalar/:id - Masa sil
- GET /api/masalar/:id/siparisler - Masa siparişlerini getir

### Kategoriler
- GET /api/kategoriler - Tüm kategorileri listele
- GET /api/kategoriler/:id - Kategori detayını getir
- POST /api/kategoriler - Yeni kategori ekle
- PUT /api/kategoriler/:id - Kategori güncelle
- DELETE /api/kategoriler/:id - Kategori sil
- GET /api/kategoriler/:id/urunler - Kategoriye ait ürünleri getir

### Ürünler
- GET /api/urunler - Tüm ürünleri listele
- GET /api/urunler/:id - Ürün detayını getir
- POST /api/urunler - Yeni ürün ekle
- PUT /api/urunler/:id - Ürün güncelle
- PUT /api/urunler/:id/stok - Ürün stok durumu güncelle
- DELETE /api/urunler/:id - Ürün sil

### Siparişler
- GET /api/siparisler - Tüm siparişleri listele
- GET /api/siparisler/:id - Sipariş detayını getir
- POST /api/siparisler - Yeni sipariş oluştur
- PUT /api/siparisler/:id - Sipariş güncelle
- PUT /api/siparisler/:id/durum - Sipariş durumu güncelle
- DELETE /api/siparisler/:id - Sipariş iptal et
- GET /api/siparisler/masa/:masaId - Masa bazlı siparişler
- GET /api/siparisler/durum/aktif - Aktif siparişleri getir
- GET /api/siparisler/tarih/:baslangic/:bitis - Tarih aralığına göre siparişler
- GET /api/siparisler/kullanici/:kullaniciId - Kullanıcı bazlı siparişler

### Müşteriler
- GET /api/musteriler - Tüm müşterileri listele
- GET /api/musteriler/:id - Müşteri detayını getir
- POST /api/musteriler - Yeni müşteri ekle
- PUT /api/musteriler/:id - Müşteri güncelle
- DELETE /api/musteriler/:id - Müşteri sil
- GET /api/musteriler/:id/siparisler - Müşteriye ait siparişler
- GET /api/musteriler/:id/rezervasyonlar - Müşteriye ait rezervasyonlar
- GET /api/musteriler/:id/faturalar - Müşteriye ait faturalar
- GET /api/musteriler/telefon/:telefon - Telefon numarasına göre müşteri ara

### Rezervasyonlar
- GET /api/rezervasyonlar - Tüm rezervasyonları listele
- GET /api/rezervasyonlar/:id - Rezervasyon detayını getir
- POST /api/rezervasyonlar - Yeni rezervasyon ekle
- PUT /api/rezervasyonlar/:id - Rezervasyon güncelle
- PUT /api/rezervasyonlar/:id/durum - Rezervasyon durumu güncelle
- DELETE /api/rezervasyonlar/:id - Rezervasyon iptal et
- GET /api/rezervasyonlar/tarih/:tarih - Belirli tarihteki rezervasyonlar
- GET /api/rezervasyonlar/tarih-aralik/:baslangic/:bitis - Tarih aralığındaki rezervasyonlar
- GET /api/rezervasyonlar/masa/:masaId - Masa bazlı rezervasyonlar
- GET /api/rezervasyonlar/musteri/:musteriId - Müşteri bazlı rezervasyonlar

### Faturalar
- GET /api/faturalar - Tüm faturaları listele
- GET /api/faturalar/:id - Fatura detayını getir
- POST /api/faturalar - Yeni fatura oluştur
- PUT /api/faturalar/:id - Fatura güncelle
- PUT /api/faturalar/:id/durum - Fatura durumu güncelle
- DELETE /api/faturalar/:id - Fatura iptal et
- GET /api/faturalar/siparis/:siparisId - Sipariş bazlı fatura getir
- GET /api/faturalar/musteri/:musteriId - Müşteri bazlı faturaları getir
- GET /api/faturalar/tarih/:baslangic/:bitis - Tarih aralığına göre faturalar
- GET /api/faturalar/odeme-turu/:odemeTuru - Ödeme türüne göre faturalar

### Raporlar
- GET /api/raporlar/satis?baslangicTarihi=YYYY-MM-DD&bitisTarihi=YYYY-MM-DD - Satış raporu
- GET /api/raporlar/urunler?baslangicTarihi=YYYY-MM-DD&bitisTarihi=YYYY-MM-DD - Ürün bazlı raporlar
- GET /api/raporlar/gunluk?tarih=YYYY-MM-DD - Günlük satış raporu
- GET /api/raporlar/aylik/:ay/:yil - Aylık satış raporu
- GET /api/raporlar/yillik/:yil - Yıllık satış raporu
- GET /api/raporlar/kategori/:kategoriId?baslangicTarihi=YYYY-MM-DD&bitisTarihi=YYYY-MM-DD - Kategori bazlı satış raporu
- GET /api/raporlar/kullanici/:kullaniciId?baslangicTarihi=YYYY-MM-DD&bitisTarihi=YYYY-MM-DD - Kullanıcı bazlı satış raporu
- GET /api/raporlar/tarih/:baslangic/:bitis - Tarih aralığı satış raporu
- GET /api/raporlar/masa?baslangicTarihi=YYYY-MM-DD&bitisTarihi=YYYY-MM-DD - Masa bazlı satış raporu
- GET /api/raporlar/musteri?baslangicTarihi=YYYY-MM-DD&bitisTarihi=YYYY-MM-DD - Müşteri bazlı raporlar

## Socket.IO Olayları

### Server'dan Client'a
- `masa_guncellendi` - Masa durumu değiştiğinde
- `siparis_alindi` - Yeni sipariş oluşturulduğunda
- `siparis_durumu_guncellendi` - Sipariş durumu değiştiğinde
- `rezervasyon_alindi` - Yeni rezervasyon oluşturulduğunda
- `siparis_hazir_bildir` - Mutfaktan sipariş hazır olduğunda

### Client'tan Server'a
- `masa_guncelle` - Masa durumu güncelleme isteği
- `yeni_siparis` - Yeni sipariş oluşturma isteği
- `siparis_durumu_guncelle` - Sipariş durumu güncelleme isteği
- `yeni_rezervasyon` - Yeni rezervasyon oluşturma isteği
- `siparis_hazir` - Sipariş hazır bildirimi

## Geliştirici Notları

### Veritabanı Alan İsimleri

Sistemde veritabanı alan isimleri snake_case formatında tanımlanmış olup, model erişimlerinde bu formata dikkat edilmelidir:

- Doğru: `siparis.toplam_tutar`, `musteri.ad_soyad`, `urun.kategori_id`
- Yanlış: `siparis.toplamTutar`, `musteri.adSoyad`, `urun.kategoriId`

### Model İsimleri 

Model isimleri büyük harfle başlar ve tekil kullanılır:

- Doğru: `db.Siparis`, `db.Musteri`, `db.Urun`
- Yanlış: `db.siparis`, `db.musteri`, `db.urun`

### İlişki İsimleri

Model ilişkilerinde tanımlanan isimler controller'larda aynı şekilde kullanılmalıdır:

- `Siparis.hasMany(SiparisDetay, { as: 'detaylar' })` → `siparis.detaylar`
- `Siparis.belongsTo(Masa, { as: 'masa' })` → `siparis.masa`

Bu kurallara uyulması, sistemin hatasız çalışması için önemlidir.

## Lisans

MIT