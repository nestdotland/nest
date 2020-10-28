import { upgradeCommand } from "../upgrade.ts";
import { publishCommand } from "../publish.ts";
import { helpCommand } from "../help.ts";

export const globalCommands = {
  [upgradeCommand.name]: upgradeCommand,
  [publishCommand.name]: publishCommand,
  [helpCommand.name]: helpCommand,
};
