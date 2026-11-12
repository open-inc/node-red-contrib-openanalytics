#!/bin/bash
set -e

# Files written to /data stay group-writable, so any uid in group 0 (e.g.
# OpenShift's random uids) can keep using the same volume.
umask 0002

USER_DIR=/data
DEFAULTS=/opt/node-red/defaults

if [ ! -w "$USER_DIR" ]; then
  echo "ERROR: $USER_DIR is not writable by uid $(id -u) gid $(id -g)." >&2
  echo "If $USER_DIR is a bind mount, make it writable for the container user," >&2
  echo "e.g. 'sudo chown -R 1001:0 <host-dir>' or run the container with --user." >&2
  exit 1
fi

cd "$USER_DIR"

# Seed a freshly mounted (empty) user dir with the image defaults. The open.INC
# nodes themselves live in /opt/node-red and need no installation here.
for f in settings.js flows.json user-authentication.js; do
  [ -f "$f" ] || install -m 664 "$DEFAULTS/$f" "./$f"
done

exec "$@"
