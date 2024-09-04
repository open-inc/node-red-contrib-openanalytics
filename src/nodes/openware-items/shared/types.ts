import { NodeMessageInFlow } from "node-red";

export interface OpenwareItemsOptions {
  server: string;
}
export type ItemsMsgType = NodeMessageInFlow & {
  sources?: string[];
};
