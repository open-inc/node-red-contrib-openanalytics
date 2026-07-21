#!/bin/bash
set -e

cd /root/.node-red

# Seed a freshly mounted (empty) user dir with the image defaults.
[ -f settings.js ] || cp /root/defaults/settings.js ./settings.js
[ -f flows.json ] || cp /root/defaults/flows.json ./flows.json
[ -f user-authentication.js ] || cp /root/defaults/user-authentication.js ./user-authentication.js

# (Re-)install the workspace packages when they are missing, e.g. after the
# user dir was bind-mounted from the host for the first time.
if [ ! -d node_modules/@openinc/node-red-contrib-openware ] ||
  [ ! -d node_modules/@openinc/node-red-contrib-openinc-parse ]; then
  echo "Installing open.INC Node-RED packages into /root/.node-red ..."
  # --install-links: pack & install the local packages (plus their runtime
  # deps) as real files rather than symlinking into the build workspace, which
  # is not present in the runtime image.
  npm install --install-links \
    /root/nodes/packages/node-red-contrib-openware \
    /root/nodes/packages/node-red-contrib-openinc-parse
fi

exec "$@"
