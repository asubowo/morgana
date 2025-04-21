FROM node:22.14.0 AS base

USER node
WORKDIR /apps/node/morgana/src
RUN chown -R node:node /apps/node/morgana/src
RUN touch /home/node/.yf2-cookies.json

FROM base AS builder
# Run 'docker image prune --filter label=stage=build' to remove this dangling image
LABEL stage=build
USER node
WORKDIR /apps/node/morgana
COPY --chown=node:node package.json .
COPY --chown=node:node package-lock.json .
RUN npm ci

# .dockerignore ignores node_modules on host system, so pull it from builder stage
FROM base AS production
USER node
WORKDIR /apps/node/morgana
# Only copy what we need
# Copy from relative path xxxx/src into container
COPY --chown=node:node --from=builder /apps/node/morgana/node_modules ./node_modules
COPY --chown=node:node ./src ./src/
COPY --chown=node:node ./assets ./assets/
ENTRYPOINT [ "node", "src/morgana.js" ]
