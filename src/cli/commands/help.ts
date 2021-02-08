import { bold, green, magenta, parse, sprintf, underline } from "../deps.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { log } from "../utils/log.ts";
import { NestCLIError } from "../utils/error.ts";

import type { Args, Command } from "../utils/types.ts";

interface Flags {
  commands?: string[];
}

export const helpCommand: Command = {
  name: "help",
  description: "Show this help or the help of a sub-command",
  arguments: [{
    name: "[...command]",
    description: "A command or a sub-command",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(helpCommand.name, helpCommand);

export function action(args = Deno.args) {
  const { commands } = assertFlags(parse(args));

  help(mainCommand, commands);
}

function assertFlags(args: Args): Flags {
  const { _: commands } = args;

  // return array of string
  for (let i = 0; i < commands.length; i++) {
    commands[i] = `${commands[i]}`;
  }

  return { commands } as Flags;
}

// **************** logic ****************

/** Determines the target command and displays help for it */
export function help(
  command: Command,
  args: string[] = [],
  parents: string[] = [],
): void {
  // current command
  const name = args[0];
  if (name && command.subCommands.size > 0) {
    if (command.subCommands.has(name)) {
      if (args[1]) {
        const parent = args.shift()!;
        return help(command.subCommands.get(name)!, args, [...parents, parent]);
      } else {
        return printHelp(command.subCommands.get(name)!, parents);
      }
    } else {
      log.error(underline(bold(name)), "is not valid command name.");
      log.info(
        "List of valid commands:",
        [...command.subCommands.keys()].map((name) => bold(name)).join(", "),
      );
      throw new NestCLIError("Invalid command name (help)");
    }
  } else {
    printHelp(command, parents);
  }
}

export function printHelp(command: Command, parents: string[]) {
  console.log(
    getDescription(command) + getUsage(command, parents) + getArgs(command) +
      getCommands(command) + getOption(command),
  );
}

function getDescription(command: Command) {
  return `  ${command.description.replaceAll("\n", "\n  ")}\n\n`;
}

function getUsage(command: Command, parents: string[]) {
  let usage = `${underline("Usage:")} ${green("nest")} `;
  for (let i = 0; i < parents.length; i++) {
    usage += `${bold(parents[i])} `;
  }
  if (command.name) usage += `${bold(command.name)} `;
  usage += command.arguments.map((arg) => arg.name).join(" ");
  return usage + "\n\n";
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
  let options = `${underline("Options:")}\n\n`;
  for (let i = 0; i < command.options.length; i++) {
    const option = command.options[i];
    // line separation with global options
    if (i === 5) options += "\n";
    options += "  ";
    options += sprintf(
      "%-40s",
      `${option.flag} ${magenta(option.argument || "")}`,
    );
    options += " ";
    options += option.description.replaceAll("\n", sprintf("\n%28s", ""));
    options += "\n";
  }
  return options;
}
