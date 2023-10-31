FROM node:16

USER root

# Bundle app source
VOLUME [ "/apps/node/morgana/src" ]
WORKDIR /apps/node/morgana/src
COPY ./src/package.json .
RUN npm install

WORKDIR /apps/node/morgana
COPY . .
RUN npm update

ENTRYPOINT [ "node", "src/morgana.js" ]