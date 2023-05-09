FROM node:18
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update \
    && apt-get install ffmpeg -y \
    && apt-get clean

WORKDIR /app

COPY ./package*.json .

RUN npm install --production

COPY ./dist ./dist

CMD [ "node", "dist/main.js" ]

## docker build --tag jefaokpta/wip-interface:1.0.0 .
## docker run -d --name=whats-100023 -p3007:3000 -e CONTROL_NUMBER=100023 -e API_PORT=3007 --restart=on-failure -v `pwd`/whatsappFiles:/whatsappFiles jefaokpta/wip-interface:1.0.0
## ATENCAO NAO ESQUECA DO COMANDO TSC!!!
