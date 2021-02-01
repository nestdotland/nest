export interface Module {
  author: string;
  name: string;
}

export type Hooks = {
  presync?: string;
  postsync?: string;
  prepack?: string;
  postpack?: string;
  prepublish?: string;
  postpublish?: string;
  preaudit?: string;
  postaudit?: string;
};

/** module.json file */
export type Meta = {
  fullName?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  issues?: string;
  license?: string;

  unlisted?: boolean;
  private?: boolean;

  main?: string;
  bin?: string[];

  keywords?: string[];
  hooks?: Hooks;
};
