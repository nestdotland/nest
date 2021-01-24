export interface Hooks {
  presync?: string;
  postsync?: string;
  prepack?: string;
  postpack?: string;
  prepublish?: string;
  postpublish?: string;
  preaudit?: string;
  postaudit?: string;
}

export interface Meta {
  fullName?: string;
  description?: string;
  homepage?: string;
  license?: string;

  unlisted?: boolean;
  private?: boolean;

  hooks?: Hooks;
}

export interface Module {
  author: string;
  name: string;
}
