import { NodeMessageInFlow } from "node-red";

export interface OpenincParseSaveOptions {
  server: string;
  className: string;
  objectId: string;
}

// payload may contain className, objectId and either a `data` object or the
// fields to save directly. Typed as `any` to stay assignable from
// NodeMessageInFlow (whose payload is `unknown`).
export type SaveMsgType = NodeMessageInFlow & {
  payload?: any;
  request?: Record<string, any>;
};
