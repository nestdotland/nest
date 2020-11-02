import { Command } from "../../utilities/types.ts";
import { helpCommand } from "../help.ts";
import { publishCommand } from "../publish.ts";
import { upgradeCommand } from "../upgrade.ts";

export const mainCommands: Record<string, Command> = {
  [helpCommand.name]: helpCommand,
  [upgradeCommand.name]: upgradeCommand,
  [publishCommand.name]: publishCommand,
};
