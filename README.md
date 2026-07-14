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
(`flows.json`, `settings.js`, installed nodes) is bind-mounted to
`./node-red/data` on the host, so flows survive container rebuilds and can be
edited directly. On first start the entrypoint seeds the folder with the
image defaults and installs both workspace packages into it.

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

