# open.INC Node-RED Monorepo

This monorepo contains the Node-RED packages by [open.INC](https://openinc.de):

| Package                                                                | Description                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`@openinc/node-red-contrib-openware`](packages/node-red-contrib-openware) | Nodes to access an open.WARE middleware (items, historical data, live data, …). |
| [`@openinc/node-red-contrib-openinc-parse`](packages/node-red-contrib-openinc-parse) | Nodes to interact with a Parse Server (CRUD, queries, LiveQuery subscriptions). |

## Development

The repo uses [pnpm workspaces](https://pnpm.io/workspaces).

```bash
pnpm install     # install all workspace dependencies
pnpm build       # build all packages
pnpm dev         # watch mode for all packages
```

To work on a single package:

```bash
pnpm --filter @openinc/node-red-contrib-openinc-parse build
```

## Docker

The repo ships a Node-RED dev container with both packages preinstalled:

```bash
docker compose up --build
```

Node-RED is served on <http://localhost:1880>. The Node-RED user dir
(`/data` in the container: `flows.json`, `settings.js`, nodes installed via the
palette) is bind-mounted to `./node-red/data` on the host, so flows survive
container rebuilds and can be edited directly. On first start the entrypoint
seeds the folder with the image defaults. Both open.INC packages are part of
the image (`/opt/node-red/node_modules`) and need no installation in `/data`.

The image is based on Red Hat's UBI 10 Node.js images and runs as a non-root
user (uid `1001`, gid `0`). It also runs under an arbitrary uid in group `0`
(e.g. OpenShift) without further configuration.

On **Linux hosts** the bind-mounted folder must be writable by that user:

```bash
mkdir -p node-red/data && sudo chown -R 1001:0 node-red/data
```

(Docker Desktop on macOS/Windows handles this automatically.)

**Migrating** a `./node-red/data` folder from the older root-based image:

1. Run the `chown` above once. The old image wrote the files as root.
2. Delete `node-red/data/node_modules/@openinc/`. Node-RED prefers modules in
   the user dir, so a leftover copy would shadow the version in the image.

### Editor authentication

By default the editor is protected with local admin credentials
(`adminAuth` in `settings.js`). To authenticate against a Parse Server
instead, set all three environment variables (e.g. in a `.env` file next to
`docker-compose.yml`):

| Variable                 | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `OI_PARSE_AUTH_ENABLED`  | Set to `true`/`1`/`yes` to enable Parse auth   |
| `OI_PARSE_URL`           | Parse Server URL, e.g. `https://host/parse`    |
| `OI_PARSE_APPID`         | Parse application id                           |

Users log in with their Parse credentials and additionally need an
`OD3_Permission` entry with key `openware:nodered`. If the flag is set but
URL or app id are missing, Node-RED falls back to the default credentials
and logs a warning.

### Credential secret

Set `NODE_RED_CREDENTIAL_SECRET` to control the key Node-RED uses to encrypt
the credentials stored in flows (`flows_cred.json`). If unset, Node-RED
generates a key and stores it in `.config.runtime.json` in the user dir. Keep
the value unchanged once credentials have been stored, otherwise they become
unreadable.

Note: `settings.js` is only copied into `/data` when it does not exist yet.
Existing user dirs keep their old `settings.js`; add the `credentialSecret`
line there manually (or delete the file to re-seed it from the image).

