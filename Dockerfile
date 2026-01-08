FROM node:20-slim

# Instalamos dependencias del sistema y Google Chrome estable
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias omitiendo la descarga de Chromium interna (usaremos el Chrome instalado arriba)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copiamos el resto del código y construimos
COPY . .
RUN npm run build

EXPOSE 3000

# Variables de entorno para producción
ENV NODE_ENV=production

CMD [ "npm", "start" ]