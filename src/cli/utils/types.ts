import { Meta } from "../../mod/utils/types.ts";

type Arg = string; // `[${string}]` | `\<${string}\>`;

/** Command option */
export interface Option {
  flag: string; // `${`-${string}, ` | ""}--${string}`;
  argument?: Arg;
  description: string;
}

/** Command argument */
export interface Argument {
  name: Arg;
  description: string;
}

export interface Command {
  name: string;
  description: string;
  arguments: Argument[];
  options: Option[];
  subCommands: Map<string, Command>;
  action: (args?: string[]) => Promise<void> | void;
}

export type Api = {
  versions: string[];
  latestVersion: string;
  lastPublished: number;
};

export type Project = {
  meta: Meta;

  ignore: string;

  api: Api;

  name: string;
  author: string;

  version: string;
  lastSync: number;
  nextAutoSync: number;
};

export type UserManager = {
  activeUser: string;
  users: Record<string, User>;
};

export type User = {
  name: string;
  token: string;
};

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

export type { Args } from "../deps.ts";
export * from "../../mod/utils/types.ts";