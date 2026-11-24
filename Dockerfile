# syntax=docker/dockerfile:1

##############################################################################
# Versions — bump deliberately. Base images are pinned to a full
# <version>-<release> tag so every build of a given commit is reproducible.
# Look up newer tags with:
#   docker manifest inspect registry.access.redhat.com/ubi10/nodejs-22-minimal:<tag>
##############################################################################
ARG BUILDER_IMAGE=registry.access.redhat.com/ubi10/nodejs-22:10.3-1793879650
ARG RUNTIME_IMAGE=registry.access.redhat.com/ubi10/nodejs-22-minimal:10.3-1793848662

##############################################################################
# Stage 1 — builder: build the workspace packages and assemble a self-contained
# Node-RED install in /opt/node-red (Node-RED + both open.INC packages + their
# runtime deps). None of the build tooling (pnpm, workspace node_modules,
# TypeScript) survives into the final image.
##############################################################################
FROM ${BUILDER_IMAGE} AS builder
# The builder stage is discarded, so building as root here is fine.
USER 0

# Matches the pnpm major used in CI (.github/workflows/BuildAndPublish.yml).
RUN npm install -g pnpm@10.34.9

WORKDIR /build

# Install workspace dependencies first (better layer caching). The lockfile is
# required: --frozen-lockfile fails the build instead of silently resolving
# different versions.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/node-red-contrib-openware/package.json ./packages/node-red-contrib-openware/package.json
COPY packages/node-red-contrib-openinc-parse/package.json ./packages/node-red-contrib-openinc-parse/package.json
RUN pnpm install --frozen-lockfile

# Build all workspace packages
COPY packages/ ./packages/
RUN pnpm -r run build

# Node-RED runtime + open.INC nodes, installed side by side. Node-RED loads node
# modules that sit next to it in node_modules, so the nodes are part of the
# image and are NOT affected by whatever is mounted on /data.
#
# Installed locally (not -g) so npm "overrides" apply to the whole tree.
# node-red 5.0.x pins vulnerable versions we cannot otherwise move:
#   - jsonata 2.0.6 (via @node-red/util) -> $toMillis DoS (GHSA-86vw-mfpg-wwv9)
#     (node-red 5.0.9 no longer installs jsonata; override kept as a guard)
#   - axios <1.18.0 (via node-red-admin) -> prototype pollution + DoS advisories
#   - body-parser <1.20.6 (via express)  -> DoS (CVE-2026-12590)
#
# --install-links packs each workspace package and installs it (plus its runtime
# deps) as real files instead of symlinks back into /build.
WORKDIR /opt/node-red
RUN cat > package.json <<'EOF'
{
  "name": "openinc-nodered-runtime",
  "private": true,
  "dependencies": {
    "node-red": "5.0.9"
  },
  "overrides": {
    "jsonata": ">=2.2.0",
    "axios": "^1.18.0",
    "body-parser": "^1.20.6"
  }
}
EOF
RUN npm install --omit=dev --install-links \
      /build/packages/node-red-contrib-openware \
      /build/packages/node-red-contrib-openinc-parse \
      @openinc/node-red-contrib-openservice \
  && npm cache clean --force

# Defaults the entrypoint copies into an empty /data on first start.
COPY node-red-flow.json /opt/node-red/defaults/flows.json
COPY settings.js user-authentication.js /opt/node-red/defaults/

##############################################################################
# Stage 2 — runtime: Red Hat's minimal Node.js image. Runs as non-root UID 1001
# with group 0, so it also works under OpenShift's random UIDs.
##############################################################################
FROM ${RUNTIME_IMAGE}

USER 0

# Remove the base image's npm (RPM nodejs-npm). Its bundled deps lag behind and
# get flagged by image scanners, and nothing needs it: Node-RED 5 ships its own
# npm (dependency of @node-red/registry) and the palette manager resolves and
# runs that copy directly. It is also the `npm` on PATH below.
RUN microdnf remove -y nodejs-npm && microdnf clean all

# Node-RED install: owned by root, read-only for the runtime user.
COPY --from=builder /opt/node-red /opt/node-red

# User dir: owned by 1001, group 0 with the same rights as the owner, so any
# UID in group 0 (OpenShift) can write to it.
RUN mkdir -p /data && chown 1001:0 /data && chmod 775 /data

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENV PATH="/opt/node-red/node_modules/.bin:${PATH}" \
    NODE_RED_ENABLE_PROJECTS=true

USER 1001
WORKDIR /data
VOLUME ["/data"]
EXPOSE 1880

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node-red", "--userDir", "/data"]
