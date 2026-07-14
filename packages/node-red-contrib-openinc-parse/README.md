# @openinc/node-red-contrib-openinc-parse

Node-RED nodes to interact with a configurable [Parse Server](https://parseplatform.org/):

| Node                    | Description                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **parse config**        | Configuration node: server URL, LiveQuery URL, App ID, REST/JavaScript/Master key, session token. Includes a connection test. |
| **parse save**          | Creates or updates an object. Updates when an `objectId` is set in the node settings or in `msg.payload.objectId`, otherwise creates. |
| **parse delete**        | Deletes an object by `className` + `objectId` (settings or `msg.payload`).                                                |
| **parse find**          | Runs a query. Accepts a full query object or a plain `where` object on `msg.payload`.                                     |
| **parse querybuilder**  | Builds a query object from configurable conditions (UI) and writes it to `msg.payload`.                                   |
| **parse subscribe**     | Subscribes to LiveQuery events (`create`, `update`, `delete`, `enter`, `leave`) with automatic reconnect.                 |
| **parse changestream**  | Polls the `OD3_Changelog` class (available on open.INC installations) in a configurable interval and outputs new entries as a change stream. |

## Typical flow

```
[inject] → [parse querybuilder] → [parse find] → [debug]
                                ↘ [parse subscribe] → [debug]
```

## Development

This package is part of the open.INC Node-RED monorepo and uses the same
build setup as `@openinc/node-red-contrib-openware`:

```bash
pnpm install
pnpm build        # or: pnpm dev for watch mode
```

The runtime code is compiled with `tsc`, the editor code is bundled per node
with Rollup into a single `.html` file next to the runtime `.js`.
