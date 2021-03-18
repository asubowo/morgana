FROM node:12

USER root

# Install app dependencies
WORKDIR /apps/node/morgana/src
COPY src/package*.json /apps/node/morgana/src/
RUN npm install
RUN npm update

# Bundle app source
WORKDIR /apps/node/morgana
COPY . .

WORKDIR /apps/node/morgana/src
ENTRYPOINT [ "node", "morgana.js" ]
