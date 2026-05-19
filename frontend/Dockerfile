FROM node:20-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala ve bağımlılıkları kur
COPY package*.json ./
RUN npm install

# Proje dosyalarını kopyala
COPY . .

# Vite sunucusunu dışa aç
EXPOSE 5173

# Geliştirme sunucusunu başlat
CMD ["npm", "run", "dev", "--", "--host"]
