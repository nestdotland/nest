/** Register commands */
import { helpCommand } from "./src/cli/commands/help.ts";
import { initCommand } from "./src/cli/commands/init.ts";
import { loginCommand } from "./src/cli/commands/login.ts";
import { logoutCommand } from "./src/cli/commands/logout.ts";
import { publishCommand } from "./src/cli/commands/publish.ts";
import { setupCommand } from "./src/cli/commands/setup.ts";
import { switchCommand } from "./src/cli/commands/switch.ts";
import { syncCommand } from "./src/cli/commands/sync.ts";
import { configCommand } from "./src/cli/commands/config/config.ts";
import { pushCommand } from "./src/cli/commands/config/push.ts";
import { pullCommand } from "./src/cli/commands/config/pull.ts";
import { diffCommand } from "./src/cli/commands/config/diff.ts";
import { statusCommand } from "./src/cli/commands/config/status.ts";
import { upgradeCommand } from "./src/cli/commands/upgrade.ts";
import { mainCommand } from "./src/cli/commands/main.ts";

configCommand.subCommands.add([
  pullCommand,
  pushCommand,
  diffCommand,
  statusCommand,
]);

mainCommand.subCommands.add([
  helpCommand,
  initCommand,
  setupCommand,
  loginCommand,
  logoutCommand,
  switchCommand,
  publishCommand,
  syncCommand,
  configCommand,
  upgradeCommand,
]);

await mainCommand.action();
