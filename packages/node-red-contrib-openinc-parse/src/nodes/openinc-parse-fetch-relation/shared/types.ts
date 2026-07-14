import { NodeMessageInFlow } from "node-red";

export type RelationSource = "config" | "payload";

export interface OpenincParseFetchRelationOptions {
  server: string;
  /** How the parent object is identified. */
  source: RelationSource;
  /** Parent class name (used when source === "config"). */
  className: string;
  /** Parent objectId (used when source === "config"). */
  objectId: string;
  /** Relation field key. Overridable per message via msg.relationKey. */
  relationKey: string;
  /**
   * Target class of the relation. Optional — auto-detected from the parent
   * object / payload when left empty.
   */
  targetClassName: string;
  limit: string;
  order: string;
}

export type FetchRelationMsgType = NodeMessageInFlow & {
  payload?: any;
  relationKey?: string;
  objectId?: string;
  className?: string;
  query?: Record<string, any>;
  parent?: { className: string; objectId: string };
};
