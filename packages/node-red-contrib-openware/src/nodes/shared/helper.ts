import { errorType, ApiMessage } from "./types";

export function isError(
  msg: ApiMessage
): msg is { status: "error"; payload: errorType } {
  return msg.status === "error";
}
