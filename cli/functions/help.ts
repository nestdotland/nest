import { bold, green, magenta, sprintf, underline } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import type { Command } from "../utilities/types.ts";

export function help(command: Command, names: string[] = []): void {
  const name = names[0];
  if (name) {
    if (name in command.subCommands) {
      if (names[1]) {
        names.shift();
        return help(command.subCommands[name], names);
      } else {
        printHelp(command.subCommands[name]);
      }
    } else {
      log.error(underline(name), "is not valid command name.");
      log.info(
        "List of valid commands:",
        Object.keys(command.subCommands).map((name) => bold(name)).join(", "),
        ".",
      );
      throw new NestCLIError("Invalid command name (help)");
    }
  } else {
    printHelp(command);
  }
}

export function printHelp(command: Command) {
  console.log(
    getDescription(command) + getUsage(command) + getArgs(command) +
      getCommands(command) + getOption(command),
  );
}

function getDescription(command: Command) {
  return `  ${command.description.replaceAll("\n", "\n  ")}\n\n`;
}

function getUsage(command: Command) {
  return `${underline("Usage:")} ${green("nest")} ${
    command.name ? `${bold(command.name)} ` : ""
  }${command.arguments.map((arg) => arg.name).join(" ")}\n\n`;
}

function getArgs(command: Command) {
  let args = "";
  if (command.arguments.length > 0) {
    args = command.arguments.map((arg) =>
      `  ${sprintf("%-39s", bold(arg.name))} ${arg.description}`
    ).join("\n");
    args += "\n\n";
  }
  return args;
}

function getCommands(command: Command) {
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
  return commands;
}

function getOption(command: Command) {
  return `${underline("Options:")}\n\n${
    command.options.map((option) =>
      `  ${
        sprintf("%-40s", `${option.flag} ${magenta(option.argument || "")}`)
      } ${option.description.replaceAll("\n", sprintf("\n%28s", ""))}`
    ).join("\n")
  }\n`;
}
