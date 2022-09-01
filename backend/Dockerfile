FROM node:16

RUN mkdir /app

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .


CMD ["yarn", "dev"]