FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R pptruser:pptruser /usr/src/app

USER pptruser

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]