import { NodeMessageInFlow } from "node-red";
import { MultiSelectPayloadType } from "../../shared/types";

export interface OpenwareItemsOptions {
  server: string;
}
export type ItemsMsgType = NodeMessageInFlow & {
  query?: MultiSelectPayloadType;
};
