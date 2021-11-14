FROM node:12

WORKDIR /blockchain
COPY package*.json ./
RUN npm install
RUN npm install --global lisk-commander
COPY . .
EXPOSE 4000 4004 4005
#./bin/run start --api-ws --enable-dashboard-plugin --enable-http-api-plugin --http-api-plugin-port 4000 --http-api-plugin-whitelist 0.0.0.0/0 --api-ws --api-ws-port 8080
#CMD [ "./bin/run", "start", "--api-ws", "--enable-dashboard-plugin", "--enable-http-api-plugin", "--http-api-plugin-port", "4000", "--http-api-plugin-whitelist", "0.0.0.0/0", "--api-ws", "--api-ws-port", "8080"]
CMD [ "./bin/run", "start"]
