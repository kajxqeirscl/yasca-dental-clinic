FROM python:3.12-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Çevresel değişkenleri ayarla
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Gerekli sistem paketlerini kur
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları kopyala ve kur
COPY requirements*.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements-dev.txt

# Proje dosyalarını kopyala
COPY . /app/

# Portu dışa aç
EXPOSE 8000

# Migration'ları çalıştır, public tenant oluştur ve Gunicorn ile sunucuyu başlat
CMD sh -c "\
  python manage.py migrate_schemas --shared --noinput && \
  python manage.py migrate_schemas --noinput && \
  python manage.py shell -c \"exec(open('create_public.py').read())\" && \
  python manage.py shell -c \"exec(open('create_tenant.py').read())\" ; \
  gunicorn core.wsgi:application --bind 0.0.0.0:8000"

