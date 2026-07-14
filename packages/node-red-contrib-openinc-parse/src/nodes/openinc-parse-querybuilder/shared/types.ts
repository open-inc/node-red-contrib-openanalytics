import { NodeMessageInFlow } from "node-red";

export type QueryConditionOperator =
  | "equalTo"
  | "notEqualTo"
  | "greaterThan"
  | "greaterThanOrEqualTo"
  | "lessThan"
  | "lessThanOrEqualTo"
  | "containedIn"
  | "notContainedIn"
  | "exists"
  | "doesNotExist"
  | "contains"
  | "startsWith"
  | "matchesRegex";

export type QueryConditionValueType =
  | "str"
  | "num"
  | "bool"
  | "json"
  | "date"
  | "pointer"
  | "msg";

export type QueryCondition = {
  field: string;
  op: QueryConditionOperator;
  value: string;
  valueType: QueryConditionValueType;
};

export interface OpenincParseQuerybuilderOptions {
  // Optional Parse config node, used only in the editor as the schema source
  // for class/field autocomplete. Not used at runtime.
  server: string;
  className: string;
  conditions: string; // JSON-serialized QueryCondition[]
  limit: string;
  skip: string;
  order: string;
  keys: string;
  include: string;
  count: boolean;
}

export type QuerybuilderMsgType = NodeMessageInFlow & {
  payload?: any;
};
