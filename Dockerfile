FROM ubuntu:24.04
USER root
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt update

ENV NODE_VERSION=22.20.0

RUN apt install -y curl git
ENV NVM_DIR=/root/.nvm
RUN mkdir -p /root/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

#Node-Red
RUN npm install -g --unsafe-perm node-red

RUN npm install -g typescript pnpm

WORKDIR /root/nodes/

# Install workspace dependencies first (better layer caching)
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
COPY packages/node-red-contrib-openware/package.json ./packages/node-red-contrib-openware/package.json
COPY packages/node-red-contrib-openinc-parse/package.json ./packages/node-red-contrib-openinc-parse/package.json
RUN pnpm install

# Build all workspace packages
COPY packages/ ./packages/
RUN pnpm -r run build

# Install every workspace package into Node-RED
WORKDIR /root/.node-red/
RUN npm install /root/nodes/packages/node-red-contrib-openware /root/nodes/packages/node-red-contrib-openinc-parse

COPY node-red-flow.json /root/.node-red/flows.json
COPY settings.js /root/.node-red/settings.js
COPY user-authentication.js /root/.node-red/user-authentication.js

# Defaults used by the entrypoint to seed a bind-mounted user dir
RUN mkdir -p /root/defaults
COPY node-red-flow.json /root/defaults/flows.json
COPY settings.js /root/defaults/settings.js
COPY user-authentication.js /root/defaults/user-authentication.js

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_RED_ENABLE_PROJECTS=true
EXPOSE 1880

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node-red"]
