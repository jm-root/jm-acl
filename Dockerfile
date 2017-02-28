# docker build -t jamma/acl:latest .
FROM node:alpine
MAINTAINER Jeff YU, jeff@jamma.cn

ADD . /app
WORKDIR /app
RUN npm install && npm cache clean

ENV NODE_ENV production
CMD [ "npm", "start" ]