FROM node

ADD ./src/ ./src
ADD ./public/ ./public
ADD ./package.json ./

RUN npm install

CMD npm start