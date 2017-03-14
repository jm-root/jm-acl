FROM jamma/server
MAINTAINER Jeff YU, jeff@jamma.cn
COPY . .
RUN npm install --production && npm cache clean