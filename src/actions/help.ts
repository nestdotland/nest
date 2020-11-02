import { bold, green, magenta, sprintf, underline } from "../../deps.ts";
import { version } from "../version.ts";
import { Command } from "../utilities/types.ts";

export function help(main: Command, name?: string) {
  if (name && name in main.subCommands) {
    getHelp(main.subCommands[name]);
  } else {
    getHelp(main);
  }
  return;
}

export function getHelp(command: Command) {
  const header = `\nnest CLI v${version}\n\n`;

  const description = `  ${command.description.replaceAll("\n", "\n  ")}\n\n`;

  const usage = `${underline("Usage:")} ${green("nest")} ${
    command.name ? `${bold(command.name)} ` : ""
  }${command.arguments}\n\n`;

  let commands = "";

  if (Object.keys(command.subCommands).length > 0) {
    commands += `${underline("Commands:")}\n\n`;
    for (const key in command.subCommands) {
      if (Object.prototype.hasOwnProperty.call(command.subCommands, key)) {
        const subCommand = command.subCommands[key];
        commands += `  ${
          sprintf(
            "%-39s",
            `${bold(subCommand.name)} ${subCommand.arguments.join(" ")}`,
          )
        } ${subCommand.description.replaceAll("\n", sprintf("\n%33s", ""))}\n`;
      }
    }
    commands += "\n\n";
  }

  const options = `${underline("Options:")}\n\n${
    command.options.map((option) =>
      `  ${
        sprintf("%-40s", `${option.flag} ${magenta(option.argument || "")}`)
      } ${option.description.replaceAll("\n", sprintf("\n%28s", ""))}`
    ).join("\n")
  }\n`;

  console.log("\n" + usage + description + commands + options);
}
