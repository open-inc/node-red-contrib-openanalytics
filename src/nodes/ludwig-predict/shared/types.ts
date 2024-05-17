import { NodeMessageInFlow } from "node-red";

export interface LudwigPredictOptions {
  // node options
}
export type ModelProperties = {
  name: string;
  createdAt: Date;
};

export type LudwigPredictMsgType = NodeMessageInFlow & {
  payload: any;
  stop: boolean;
};
