FROM node:12

USER root

WORKDIR /apps/node/morgana

# Install app dependencies
COPY src/package*.json src/
RUN npm install

# Bundle app source
COPY . .

WORKDIR /apps/node/morgana/src
ENTRYPOINT [ "node", "morgana.js" ]
