/** Register commands */
import "./cli/commands/help.ts";
import "./cli/commands/init.ts";
import "./cli/commands/login.ts";
import "./cli/commands/logout.ts";
import "./cli/commands/publish.ts";
import "./cli/commands/setup.ts";
import "./cli/commands/switch.ts";
import "./cli/commands/sync.ts";
import "./cli/commands/upgrade.ts";

import { mainCommand } from "./cli/commands/main.ts";

await mainCommand.action();
