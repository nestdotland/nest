export interface Option {
  flag: string;
  argument?: string;
  description: string;
}

export interface Command {
  name: string;
  description: string;
  arguments: string[];
  options: Option[];
  subCommands: Record<string, Command>;
  action: () => Promise<void>;
}
