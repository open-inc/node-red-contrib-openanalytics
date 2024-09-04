import { errorType, ApiMessage } from "./types";

export function isError(
  ApiMessage: ApiMessage
): ApiMessage is { status: "error"; payload: errorType } {
  return ApiMessage.status === "error";
}
