import { NodeInitializer } from "node-red";
import { OpenwareItemsNode, OpenwareItemsNodeDef } from "./modules/types";
import { ConfigNode, ItemMessage, OWItemType } from "../shared/types";
import { ItemsMsgType } from "./shared/types";
import { isError } from "../shared/helper";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareItemsNodeConstructor(
    this: OpenwareItemsNode,
    config: OpenwareItemsNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;
    if (server && server.credentials.session) {
    }

    node.on("input", async function (msg: ItemsMsgType) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });

        return;
      } else {
        node.status({});
      }

      if (msg.sources) {
        const reqs = msg.sources.map((source) => server.api.items(source));

        const items = await Promise.all(reqs);
        const result2return = {
          status: "success",
          items: [],
          payload: [],
        } as ItemMessage;

        for (const item of items) {
          if (isError(item)) {
            node.error(item);
            return;
          } else {
            //F**K TYPESCRIPT
            if (isError(result2return)){
              return;
            } 
            result2return.items = result2return.items.concat(item.items);
            result2return.payload = result2return.payload.concat(item.payload);
          }
        }

        node.send(result2return);
      } else {
        const items = await server.api.items();
        if (items.status === "error") {
          node.error(items);
        }
        node.send(items);
      }
    });
  }

  RED.nodes.registerType("openware-items", OpenwareItemsNodeConstructor);
};

export = nodeInit;
