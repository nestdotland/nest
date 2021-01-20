import { Hooks, Meta } from "../../lib/utilities/types.ts";

/** Command option */
export interface Option {
  flag: string;
  argument?: string;
  description: string;
}

/** Command argument */
export interface Argument {
  name: string;
  description: string;
}

export interface Command {
  name: string;
  description: string;
  arguments: Argument[];
  options: Option[];
  subCommands: Record<string, Command>;
  action: (args?: string[]) => Promise<void> | void;
}

export interface Api {
  versions: string[];
  latestVersion: string;
  lastPublished: number;
}

export interface Project {
  meta: Meta;

  api: Api;

  version: string;
  lastSync: number;
  nextAutoSync: number;
}

export * from "../../lib/utilities/types.ts";
export type { Diff, Json, JSONArray, JSONObject, JSONValue } from "./json.ts";
