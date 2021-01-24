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

  name: string;
  author: string;

  version: string;
  lastSync: number;
  nextAutoSync: number;
}

export interface UserManager {
  activeUser: string;
  users: Record<string, User>;
}

export interface User {
  name: string;
  token: string;
}

export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];
export type JSONValue =
  | string
  | number
  | JSONObject
  | JSONArray
  | boolean
  | null;
export type Json = JSONArray | JSONObject;

export * from "../../lib/utilities/types.ts";
