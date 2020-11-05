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
  action: () => Promise<void>;
}

export interface Hooks {
  presync: string;
  postsync: string;
  prepack: string;
  postpack: string;
  prepublish: string;
  postpublish: string;
  preaudit: string;
  postaudit: string;
}

export interface Module {
  $schema: string;

  name: string;
  fullName?: string;
  description?: string;
  homepage?: string;
  license?: string;

  hooks: Hooks;

  unlisted?: boolean;
  private?: boolean;
}

export interface ModuleData {
  meta: Module;

  api: {
    versions: string[];
    latestVersion: string;
    lastPublished: number;
    license: string;
  };

  version: string;
  lastSync: number;
  nextAutoSync: number;
}
