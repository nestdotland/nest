/** Register commands */
import "./src/cli/commands//config/config.ts";
import "./src/cli/commands/help.ts";
import "./src/cli/commands/init.ts";
import "./src/cli/commands/login.ts";
import "./src/cli/commands/logout.ts";
import "./src/cli/commands/publish.ts";
import "./src/cli/commands/setup.ts";
import "./src/cli/commands/switch.ts";
import "./src/cli/commands/sync.ts";
import "./src/cli/commands/upgrade.ts";

import { mainCommand } from "./src/cli/commands/main.ts";

await mainCommand.action();
