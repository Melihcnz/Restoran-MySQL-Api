#!/bin/bash

# Docker Logları Yönetim Script'i
# Bu script Docker container loglarını dosyaya kaydeder ve yönetir

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Restoran Yönetim Sistemi Log Yöneticisi ===${NC}"

# Log dizinlerini oluştur
create_log_dirs() {
    echo -e "${YELLOW}Log dizinleri oluşturuluyor...${NC}"
    mkdir -p logs/mysql
    mkdir -p logs/api
    mkdir -p logs/phpmyadmin
    mkdir -p logs/backup
    chmod 755 logs
    chmod 755 logs/*
    echo -e "${GREEN}✓ Log dizinleri oluşturuldu${NC}"
}

# Tüm container loglarını göster
show_all_logs() {
    echo -e "${YELLOW}Tüm container logları:${NC}"
    docker-compose logs --tail=50
}

# Belirli servis loglarını göster
show_service_logs() {
    echo -e "${YELLOW}Hangi servisin loglarını görmek istiyorsunuz?${NC}"
    echo "1) MySQL"
    echo "2) API"
    echo "3) phpMyAdmin"
    read -p "Seçiminiz (1-3): " choice
    
    case $choice in
        1) docker-compose logs mysql --tail=100 ;;
        2) docker-compose logs api --tail=100 ;;
        3) docker-compose logs phpmyadmin --tail=100 ;;
        *) echo -e "${RED}Geçersiz seçim${NC}" ;;
    esac
}

# Logları dosyaya kaydet
export_logs() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    echo -e "${YELLOW}Loglar dosyaya kaydediliyor...${NC}"
    
    # Her servis için ayrı dosya
    docker-compose logs mysql > "logs/backup/mysql_${timestamp}.log"
    docker-compose logs api > "logs/backup/api_${timestamp}.log"
    docker-compose logs phpmyadmin > "logs/backup/phpmyadmin_${timestamp}.log"
    
    # Tüm logları birleştir
    docker-compose logs > "logs/backup/all_services_${timestamp}.log"
    
    echo -e "${GREEN}✓ Loglar kaydedildi: logs/backup/${NC}"
    ls -la logs/backup/*${timestamp}*
}

# Canlı log takibi
follow_logs() {
    echo -e "${YELLOW}Canlı log takibi başlıyor... (Çıkmak için Ctrl+C)${NC}"
    docker-compose logs -f
}

# Log dosyalarını temizle
clean_logs() {
    read -p "Eski log dosyalarını silmek istediğinizden emin misiniz? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo -e "${YELLOW}Log dosyaları temizleniyor...${NC}"
        rm -f logs/backup/*.log
        docker system prune -f
        echo -e "${GREEN}✓ Log dosyaları temizlendi${NC}"
    else
        echo -e "${BLUE}İşlem iptal edildi${NC}"
    fi
}

# Container durumlarını göster
show_status() {
    echo -e "${YELLOW}Container durumları:${NC}"
    docker-compose ps
    echo ""
    echo -e "${YELLOW}Docker sistem bilgileri:${NC}"
    docker system df
}

# Ana menü
main_menu() {
    while true; do
        echo ""
        echo -e "${BLUE}=== LOG YÖNETİMİ MENÜSÜ ===${NC}"
        echo "1) Log dizinlerini oluştur"
        echo "2) Tüm logları göster"
        echo "3) Belirli servis loglarını göster"
        echo "4) Logları dosyaya kaydet"
        echo "5) Canlı log takibi"
        echo "6) Log dosyalarını temizle"
        echo "7) Container durumlarını göster"
        echo "8) Çıkış"
        echo ""
        read -p "Seçiminizi yapın (1-8): " choice
        
        case $choice in
            1) create_log_dirs ;;
            2) show_all_logs ;;
            3) show_service_logs ;;
            4) export_logs ;;
            5) follow_logs ;;
            6) clean_logs ;;
            7) show_status ;;
            8) echo -e "${GREEN}Çıkılıyor...${NC}"; exit 0 ;;
            *) echo -e "${RED}Geçersiz seçim. Lütfen 1-8 arası bir sayı girin.${NC}" ;;
        esac
    done
}

# Script'i çalıştır
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_menu
fi 