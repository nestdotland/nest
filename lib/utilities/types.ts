export interface Module {
  author: string;
  name: string;
}

export type HookPrefix = "pre" | "post";
export type Hook = "sync" | "pack" | "publish" | "audit";
export type Hooks = {
  [K in `${HookPrefix}${Capitalize<Hook>}`]?: string;
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
