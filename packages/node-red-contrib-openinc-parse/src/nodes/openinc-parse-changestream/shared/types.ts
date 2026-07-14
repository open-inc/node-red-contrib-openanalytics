import { NodeMessageInFlow } from "node-red";

export interface OpenincParseChangestreamOptions {
  server: string;
  className: string; // filter on nameOfClass, empty = all classes
  operations: string; // comma separated filter on operation, empty = all
  interval: string; // poll interval in seconds
  limit: string; // max entries per poll
  emitExisting: boolean; // emit all existing changelog entries on start
}

export type ChangelogEntry = {
  objectId: string;
  createdAt: string;
  updatedAt: string;
  nameOfClass: string;
  changedObject: string;
  operation: string;
  value?: Record<string, any>;
  original?: Record<string, any>;
  actingUser?: Record<string, any>;
  masterkey?: boolean;
  context?: Record<string, any>;
};

export type ChangestreamMsgType = NodeMessageInFlow & {
  payload?: any;
};
