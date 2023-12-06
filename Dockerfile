FROM node:17 AS base

USER node
WORKDIR /apps/node/morgana/src
RUN chown -R node:node /apps/node/morgana/src

FROM base AS builder
# Run 'docker image prune --filter label=stage=build' to remove this dangling image
LABEL stage=build
USER node
WORKDIR /apps/node/morgana/src
COPY --chown=node:node ./src/package.json .
COPY --chown=node:node ./src/package-lock.json .
RUN npm ci

# .dockerignore ignores node_modules on host system, so pull it from builder stage
FROM base AS production
USER node
WORKDIR /apps/node/morgana
# Only copy what we need
# Copy from relative path xxxx/src into container
COPY --chown=node:node --from=builder /apps/node/morgana/src/node_modules ./src/node_modules
COPY --chown=node:node ./src ./src/
COPY --chown=node:node ./assets ./assets/
ENTRYPOINT [ "node", "src/morgana.js" ]