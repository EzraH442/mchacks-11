FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY ./ ./
COPY ./package*.json ./

RUN npm install 
RUN npm install -g serve

RUN npm run build

CMD ["serve", "-s", "build"]
