import { bold, green, magenta, sprintf, underline } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import type { Command } from "../utilities/types.ts";

export function help(main: Command, name?: string) {
  if (name) {
    if (name in main.subCommands) {
      printHelp(main.subCommands[name]);
    } else {
      log.error(`${underline(name)} is not valid command name.`);
      log.info(
        `List of valid commands: ${
          Object.keys(main.subCommands).map((name) => bold(name)).join(", ")
        }.`,
      );
      throw new NestCLIError("Invalid command name (help)");
    }
  } else {
    printHelp(main);
  }
  return;
}

export function printHelp(command: Command) {
  // TODO(oganexon): refactor this function

  const description = `  ${command.description.replaceAll("\n", "\n  ")}\n\n`;

  const usage = `${underline("Usage:")} ${green("nest")} ${
    command.name ? `${bold(command.name)} ` : ""
  }${command.arguments.map((arg) => arg.name).join(" ")}\n\n`;

  let args = "";

  if (command.arguments.length > 0) {
    args = command.arguments.map((arg) =>
      `  ${sprintf("%-39s", bold(arg.name))} ${arg.description}`
    ).join("\n");
    args += "\n\n";
  }

  let commands = "";

  if (Object.keys(command.subCommands).length > 0) {
    commands += `${underline("Commands:")}\n\n`;
    for (const key in command.subCommands) {
      if (Object.prototype.hasOwnProperty.call(command.subCommands, key)) {
        const subCommand = command.subCommands[key];
        commands += `  ${
          sprintf(
            "%-39s",
            `${bold(subCommand.name)} ${
              subCommand.arguments.map((arg) => arg.name).join(" ")
            }`,
          )
        } ${subCommand.description.replaceAll("\n", sprintf("\n%33s", ""))}\n`;
      }
    }
    commands += "\n";
  }

  const options = `${underline("Options:")}\n\n${
    command.options.map((option) =>
      `  ${
        sprintf("%-40s", `${option.flag} ${magenta(option.argument || "")}`)
      } ${option.description.replaceAll("\n", sprintf("\n%28s", ""))}`
    ).join("\n")
  }\n`;

  console.log(description + usage + args + commands + options);
}
