import { NodeMessageInFlow } from "node-red";
import { ChildProcessWithoutNullStreams } from "node:child_process";

export type ProcessChild = ChildProcessWithoutNullStreams | undefined | null;
export type ValueType = {
  type: "number" | "string" | "boolean" | "geo" | "object";
  name: string;
  unit: string;
};
export type DataPoint = {
  date: number;
  value: any[];
};
export type LudwigMsgType = NodeMessageInFlow & {
  mode: "train" | "predict";
  payload: {
    values: DataPoint[];
    valueTypes: ValueType[];
  };
};
