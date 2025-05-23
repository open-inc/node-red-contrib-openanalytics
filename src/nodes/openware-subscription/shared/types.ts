import { NodeMessageInFlow } from "node-red";
import { MultiSelectPayloadType } from "../../shared/types";

export interface OpenwareSubscriptionOptions {
  server: string;
}
export type SubscriptionMsgType = NodeMessageInFlow & {
  disconnect?: boolean;
  query?: MultiSelectPayloadType;
};
