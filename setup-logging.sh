#!/bin/bash

# Log Sistemi Kurulum Script'i
# Bu script log dosyalarını ve dizinlerini otomatik olarak kurar

set -e

# Renkli çıktı
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Log Sistemi Kurulumu Başlatılıyor ===${NC}"

# 1. Log dizinlerini oluştur
echo -e "${YELLOW}1. Log dizinleri oluşturuluyor...${NC}"
mkdir -p logs/{mysql,api,phpmyadmin,backup,nginx}
chmod -R 755 logs/

# 2. Log dosyalarını oluştur (boş)
touch logs/mysql/error.log
touch logs/mysql/slow.log
touch logs/api/app.log
touch logs/api/error.log
touch logs/phpmyadmin/access.log

# 3. Logrotate konfigürasyonunu kur (sudo gerekli)
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}2. Logrotate konfigürasyonu kuruluyor...${NC}"
    CURRENT_DIR=$(pwd)
    sed "s|/path/to/project|$CURRENT_DIR|g" log-rotate.conf > /etc/logrotate.d/restoran-logs
    echo -e "${GREEN}✓ Logrotate konfigürasyonu kuruldu${NC}"
else
    echo -e "${YELLOW}2. Logrotate konfigürasyonu için:${NC}"
    echo "sudo bash setup-logging.sh komutunu çalıştırın"
fi

# 4. Cron job ekle (günlük log backup)
echo -e "${YELLOW}3. Otomatik log backup cron job'u ekleniyor...${NC}"
CURRENT_DIR=$(pwd)
CRON_JOB="0 2 * * * cd $CURRENT_DIR && ./logs-manager.sh export_logs"

# Mevcut cron job'ları kontrol et
if ! crontab -l 2>/dev/null | grep -q "logs-manager.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ Günlük otomatik backup cron job'u eklendi${NC}"
else
    echo -e "${YELLOW}Cron job zaten mevcut${NC}"
fi

# 5. Script'leri çalıştırılabilir yap
chmod +x logs-manager.sh
chmod +x setup-logging.sh

# 6. .gitignore'a log dosyalarını ekle
if [ -f .gitignore ]; then
    if ! grep -q "logs/" .gitignore; then
        echo -e "\n# Log dosyaları" >> .gitignore
        echo "logs/" >> .gitignore
        echo "*.log" >> .gitignore
        echo -e "${GREEN}✓ .gitignore güncellendi${NC}"
    fi
fi

echo -e "${GREEN}=== Log Sistemi Kurulumu Tamamlandı! ===${NC}"
echo ""
echo -e "${YELLOW}Kullanım:${NC}"
echo "• Log yönetimi: ./logs-manager.sh"
echo "• Logları görüntüle: docker-compose logs"
echo "• Canlı takip: docker-compose logs -f"
echo "• Manuel backup: ./logs-manager.sh (seçenek 4)"
echo ""
echo -e "${YELLOW}Log dizinleri:${NC}"
find logs/ -type d 