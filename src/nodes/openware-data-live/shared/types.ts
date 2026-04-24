import { NodeMessageInFlow } from "node-red";
import { SensorInfoType } from "src/nodes/shared/types";

export interface OpenwareDataLiveOptions {
  server: string;
  output: "JSON" | "VALUES_ONLY" | "CSV";
  amount?: number;
  delimiter?: string;
}

export type LiveMsgPayloadType = NodeMessageInFlow & {
  amount?: number;
  date?: number;

  query?: {
    end?: number;
    sensorInfos?: SensorInfoType[];
  };
};
