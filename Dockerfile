# syntax=docker/dockerfile:1

##############################################################################
# Stage 1 — builder: install Node-RED, build the workspace packages and stage
# a ready-to-run ~/.node-red. None of the build tooling (pnpm, workspace
# node_modules, TypeScript compiler) survives into the final image.
##############################################################################
FROM redhat/ubi10-minimal:latest AS builder
USER root
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ENV NODE_VERSION=22.23.1

# git for nvm/npm, tar+gzip+xz for extracting the Node binary tarball.
# curl is already provided by curl-minimal on UBI, so we don't install it
# (doing so conflicts with the preinstalled curl-minimal package).
RUN microdnf install -y git tar gzip xz && microdnf clean all
ENV NVM_DIR=/root/.nvm
RUN mkdir -p /root/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION} \
  && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

# Refresh the npm that ships with Node to the latest release. npm bundles a
# large set of its own dependencies (sigstore, glob, minimatch, tar, picomatch,
# brace-expansion, ip-address, diff, ...); the version baked into the Node
# tarball lags behind, so image scanners flag those bundled copies. Upgrading
# npm replaces them with the current, patched versions.
RUN . "$NVM_DIR/nvm.sh" && npm install -g npm@latest

# Node-RED — installed locally (not -g) so we can force patched transitive
# dependencies via npm "overrides", which only apply to a local (project)
# install. node-red 5.0.1 pins vulnerable versions we cannot otherwise move:
#   - jsonata 2.0.6 (via @node-red/util) -> $toMillis DoS (GHSA-86vw-mfpg-wwv9)
#   - axios <1.18.0 (via node-red-admin) -> prototype pollution + DoS advisories
#   - body-parser <1.20.6 (via express)  -> DoS (CVE-2026-12590)
# The install's bin dir is prepended to PATH so the `node-red` command works.
WORKDIR /root/nodered
RUN cat > package.json <<'EOF'
{
  "name": "openinc-nodered-runtime",
  "private": true,
  "dependencies": {
    "node-red": "^5.0.1"
  },
  "overrides": {
    "jsonata": ">=2.2.0",
    "axios": "^1.18.0",
    "body-parser": "^1.20.6"
  }
}
EOF
RUN npm install
ENV PATH="/root/nodered/node_modules/.bin:${PATH}"

# pnpm is only needed to build the workspace; it never reaches the final image.
RUN npm install -g pnpm

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

# Install every workspace package into Node-RED's user dir.
# --install-links packs each local package and installs it (plus its runtime
# deps: ws, tslib, form-data-body, json-to-pretty-yaml) as real files instead
# of symlinking back into the workspace, so /root/.node-red is self-contained
# and survives being copied into the runtime stage without /root/nodes/node_modules.
WORKDIR /root/.node-red/
RUN npm install --install-links /root/nodes/packages/node-red-contrib-openware /root/nodes/packages/node-red-contrib-openinc-parse

COPY node-red-flow.json /root/.node-red/flows.json
COPY settings.js /root/.node-red/settings.js
COPY user-authentication.js /root/.node-red/user-authentication.js

# Defaults used by the entrypoint to seed a bind-mounted user dir
RUN mkdir -p /root/defaults
COPY node-red-flow.json /root/defaults/flows.json
COPY settings.js /root/defaults/settings.js
COPY user-authentication.js /root/defaults/user-authentication.js

##############################################################################
# Stage 2 — runtime: a clean image carrying only what Node-RED needs to run.
# Node + npm (npm is used by the entrypoint to (re)install the nodes into a
# freshly bind-mounted user dir), the Node-RED install, the staged user dir,
# the built packages and the seed defaults. No pnpm, no TypeScript, no build
# workspace node_modules.
##############################################################################
FROM redhat/ubi10-minimal:latest
USER root
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ENV NODE_VERSION=22.23.1
ENV PATH="/root/nodered/node_modules/.bin:/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

# Copy the Node toolchain (node + the npm@latest we installed) from the builder
# instead of reinstalling it here. This is why the runtime stage needs no
# git/tar/gzip/xz (nor curl or nvm): nothing is downloaded or extracted — Node
# is already built and simply carried over. npm itself is kept because the
# entrypoint uses it to (re)install the nodes into a freshly bind-mounted user dir.
COPY --from=builder /root/.nvm/versions/node/v${NODE_VERSION} /root/.nvm/versions/node/v${NODE_VERSION}
# Drop the build-only pnpm that lived in the builder's global Node install.
RUN npm rm -g pnpm

# Copy the built runtime artifacts from the builder.
COPY --from=builder /root/nodered /root/nodered
COPY --from=builder /root/.node-red /root/.node-red
COPY --from=builder /root/nodes/packages /root/nodes/packages
COPY --from=builder /root/defaults /root/defaults

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_RED_ENABLE_PROJECTS=true
EXPOSE 1880

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node-red"]
