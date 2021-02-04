import { bold, green, magenta, sprintf, underline } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import type { Command } from "../utilities/types.ts";

/** Determines the target command and displays help for it */
export function help(command: Command, names: string[] = []): void {
  // current command
  const name = names[0];
  if (name && command.subCommands.size > 0) {
    if (command.subCommands.has(name)) {
      if (names[1]) {
        names.shift();
        return help(command.subCommands.get(name)!, names);
      } else {
        return printHelp(command.subCommands.get(name)!);
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
  if (command.subCommands.size > 0) {
    commands += `${underline("Commands:")}\n\n`;
    for (const [_, subCommand] of command.subCommands) {
      commands += `  ${
        sprintf(
          "%-39s",
          `${bold(subCommand.name)} ${
            subCommand.arguments.map((arg) => arg.name).join(" ")
          }`,
        )
      } ${subCommand.description.replaceAll("\n", sprintf("\n%33s", ""))}\n`;
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
