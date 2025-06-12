# Node.js resmi imajını kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci --only=production

# Uygulama dosyalarını kopyala
COPY . .

# Uygulamanın çalışacağı portu belirt
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "start"] 