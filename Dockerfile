FROM node:20-slim

# Instalamos las librerías necesarias para Puppeteer y Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxshmfence1 \
    libglu1 \
    libgobject-2.0-0 \
    fonts-liberation \
    libappindicator3-1 \
    libxdamage1 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcups2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

CMD [ "npm", "start" ]