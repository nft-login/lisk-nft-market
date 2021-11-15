FROM node:12

WORKDIR /blockchain
COPY package*.json ./
RUN npm install
RUN npm install --global lisk-commander
COPY . .
EXPOSE 4000 4004 4005
CMD [ "./bin/run", "start"]
