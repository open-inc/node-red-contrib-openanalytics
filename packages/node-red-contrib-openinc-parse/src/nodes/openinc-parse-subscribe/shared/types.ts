import { NodeMessageInFlow } from "node-red";

export interface OpenincParseSubscribeOptions {
  server: string;
  className: string;
  where: string; // JSON-serialized where object
}

export type SubscribeMsgType = NodeMessageInFlow & {
  payload?: any;
  disconnect?: boolean;
};
