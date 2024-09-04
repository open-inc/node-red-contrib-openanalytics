import { NodeMessageInFlow } from "node-red";

export interface OpenwareSubscriptionOptions {
  server: string;
}
export type SubscriptionMsgType = NodeMessageInFlow & {
  disconnect?: boolean;
};
