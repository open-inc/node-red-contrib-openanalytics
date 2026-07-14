import { NodeMessageInFlow } from "node-red";

export interface OpenincParseDeleteOptions {
  server: string;
  className: string;
  objectId: string;
}

// payload is either a string objectId or an object with objectId and
// optionally className.
export type DeleteMsgType = NodeMessageInFlow & {
  payload?: any;
};
