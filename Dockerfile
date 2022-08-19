FROM node:16

USER root

# Bundle app source
WORKDIR /apps/node/morgana
COPY . .

# Install app dependencies
WORKDIR /apps/node/morgana/src
RUN npm install
RUN npm update

WORKDIR /apps/node/morgana
ENTRYPOINT [ "node", "src/morgana.js" ]
