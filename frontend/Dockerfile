FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY public/ /app/public
COPY src/ /app/src
COPY package.json /app/

RUN npm install 
RUN npm install -g serve

CMD ["serve", "--", "-s", "build"]