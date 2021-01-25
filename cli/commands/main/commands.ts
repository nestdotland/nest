import { Command } from "../../utilities/types.ts";
import { helpCommand } from "../help.ts";
import { publishCommand } from "../publish.ts";
import { upgradeCommand } from "../upgrade.ts";
import { initCommand } from "../init.ts";
import { syncCommand } from "../sync.ts";
import { loginCommand } from "../login.ts";
import { logoutCommand } from "../logout.ts";
import { switchCommand } from "../switch.ts";

export const mainCommands: Record<string, Command> = {
  [helpCommand.name]: helpCommand,
  [initCommand.name]: initCommand,
  [syncCommand.name]: syncCommand,
  [publishCommand.name]: publishCommand,
  [upgradeCommand.name]: upgradeCommand,
  [loginCommand.name]: loginCommand,
  [switchCommand.name]: switchCommand,
  [logoutCommand.name]: logoutCommand,
};
