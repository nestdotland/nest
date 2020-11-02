export interface Option {
  flag: string;
  argument?: string;
  description: string;
}

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
