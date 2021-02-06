import { basename, cyan, green, parse, yellow } from "../deps.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { log } from "../utils/log.ts";
import * as config from "../config/config.ts";
import { addToGitIgnore } from "../utils/git.ts";
import { setup } from "./setup.ts";
import { confirm, prompt, promptAndValidate } from "../utils/interact.ts";

import type { Args, Command } from "../utils/types.ts";

export const initCommand: Command = {
  name: "init",
  description: "Initiate a new module for the nest.land registry",
  arguments: [],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(initCommand.name, initCommand);

export async function action(args = Deno.args) {
  assertFlags(parse(args));

  await init();
}

function assertFlags(args: Args): void {
  const { _: remainingArgs, ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  return;
}

// **************** logic ****************

/** Initiate a new module for the nest.land registry */
export async function init() {
  const user = await config.users.getActive();

  const dirName = basename(Deno.cwd());

  if (
    !await confirm(`Initialize directory ${green(`${dirName}/`)} ?`, true)
  ) {
    return;
  }

  if (await confirm("Link to an existing module?")) {
    await setup();
    return;
  }

  const name = await promptAndValidate({
    message: "Module name",
    invalidMessage: `A module name must have length ${yellow("2")} to ${
      yellow("40")
    } with characters ${cyan("a-z")}, ${cyan("A-Z")}, ${cyan("0-9")}, ${
      cyan("_")
    }, ${cyan("-")}, ${cyan(".")} and ${cyan(":")}.`,
    defaultValue: dirName,
    validate: (name) =>
      name.length > 1 && name.length < 41 &&
      !!name.match(/^(\d|\w|[_\-:\.])*$/),
  });

  const fullName = await prompt("Module full name", name);

  const description = await prompt("Description");

  const homepage = await prompt("Homepage");

  const license = await prompt("License", "UNKNOWN");

  const meta = {
    fullName,
    description,
    homepage,
    license,
  };

  const ignoreContent =
    "# List here the files and directories to be ignored, one by line as a glob expression.\n\n# Dotfiles are ignored by default.\n.*\n";

  await config.dir.ensure();
  await config.meta.write(meta);
  await config.project.write({
    meta,
    ignore: ignoreContent,
    api: {
      versions: [],
      lastPublished: 0,
      latestVersion: "",
    },
    name,
    author: user.name,
    version: "0.0.0",
    lastSync: 0,
    // TODO: implement auto sync
    nextAutoSync: 0,
  });
  await config.ignore.write(ignoreContent);

  await addToGitIgnore([config.dir.PATH]);

  log.info(
    `Linked to ${cyan(`${user.name}/${name}`)} (created ${
      green(config.dir.PATH)
    })`,
  );
}
