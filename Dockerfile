FROM node:12

USER root

WORKDIR /apps/node/morgana

# Install app dependencies
WORKDIR /apps/node/morgana/src
COPY src/package*.json /apps/node/morgana/src/
RUN npm install

# Bundle app source
WORKDIR /apps/node/morgana
COPY . .

WORKDIR /apps/node/morgana/src
ENTRYPOINT [ "node", "morgana.js" ]
