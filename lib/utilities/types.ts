import { hook, hookPrefix } from "./const.ts";

export interface Module {
  author: string;
  name: string;
}

export type HookPrefix = (typeof hookPrefix)[number];
export type Hook = (typeof hook)[number];
export type Hooks = {
  [K in `${HookPrefix}${Hook}`]?: string;
};

/** module.json file */
export type Meta = {
  main?: string;
  bin?: string[];

  fullName?: string;
  description?: string;
  logo?: string;
  homepage?: string;
  repository?: string;
  issues?: string;
  license?: string;

  unlisted?: boolean;
  private?: boolean;

  keywords?: string[];
  hooks?: Hooks;
};
