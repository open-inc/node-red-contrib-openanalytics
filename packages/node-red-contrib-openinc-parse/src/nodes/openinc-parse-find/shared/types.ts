import { NodeMessageInFlow } from "node-red";

export interface OpenincParseFindOptions {
  server: string;
  className: string;
  limit: string;
  order: string;
}

export type FindMsgType = NodeMessageInFlow & {
  payload?: any;
  count?: number;
  query?: Record<string, any>;
};
