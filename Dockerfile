FROM node:20-slim

# Instalamos las librerías necesarias para Puppeteer en Debian Bookworm
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxshmfence1 \
    libglib2.0-0 \
    fonts-liberation \
    libxdamage1 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcups2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

# Instalamos dependencias
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Forzamos que Puppeteer descargue su propio Chrome durante el build
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

CMD [ "npm", "start" ]