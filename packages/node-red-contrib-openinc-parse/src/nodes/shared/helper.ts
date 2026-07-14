import { ParseQuery } from "./types";

const QUERY_KEYS = [
  "className",
  "where",
  "limit",
  "skip",
  "order",
  "keys",
  "include",
  "count",
];

/**
 * Interprets msg.payload either as a full query object ({ className, where,
 * limit, ... }) or as a plain "where" object. Non-object payloads result in
 * an empty query.
 */
export function resolveQuery(
  payload: unknown,
  fallbackClassName?: string
): ParseQuery {
  let query: ParseQuery = {};
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, any>;
    const looksLikeQuery = QUERY_KEYS.some((key) => key in obj);
    if (looksLikeQuery) {
      query = {
        className: obj.className,
        where: obj.where,
        limit: obj.limit,
        skip: obj.skip,
        order: obj.order,
        keys: obj.keys,
        include: obj.include,
        count: obj.count,
      };
    } else if (Object.keys(obj).length > 0) {
      query = { where: obj };
    }
  }
  if (!query.className && fallbackClassName) {
    query.className = fallbackClassName;
  }
  return query;
}
