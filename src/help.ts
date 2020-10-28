import { sprintf } from "../deps.ts";
import { version } from "./version.ts";
import { Command } from "./utilities/types.ts";
import { globalCommands } from "./commands/global/commands.ts";
import { globalCommand } from "./commands/global.ts";

export function help(name?: string) {
  if (name && name in globalCommands) {
    getHelp(globalCommands[name]);
  } else {
    getHelp(globalCommand);
  }
  return;
}

function getHelp(command: Command) {
  const header = `\nnest CLI v${version}\n\n`;

  const description = `  ${command.description.replaceAll("\n", "\n  ")}\n\n`;

  const usage = `Usage:\n  $ nest ${
    command.name ? `${command.name} ` : ""
  }${command.arguments}\n\n`;

  let commands = "";

  if (Object.keys(command.subCommands).length > 0) {
    commands += "Commands:\n";
    for (const key in command.subCommands) {
      if (Object.prototype.hasOwnProperty.call(command.subCommands, key)) {
        const subCommand = command.subCommands[key];
        commands += `  ${
          sprintf(
            "%-25s",
            `${subCommand.name} ${subCommand.arguments.join(" ")}`,
          )
        } ${subCommand.description.replaceAll("\n", sprintf("\n%28s", ""))}\n`;
      }
    }
    commands += "\n\n";
  }

  const options = `Options:\n${
    command.options.map((option) =>
      `  ${sprintf("%-25s", `${option.flag} ${option.argument || ""}`)} ${
        option.description.replaceAll("\n", sprintf("\n%28s", ""))
      }`
    ).join("\n")
  }\n`;

  console.log(header + description + usage + commands + options);
}
