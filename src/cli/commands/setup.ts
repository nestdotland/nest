import { basename, cyan, green, parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { setupCheckType } from "../processing/check_type.ts";
import { NestCLIError } from "../utils/error.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { log } from "../utils/log.ts";
import { downloadConfig } from "../../mod/api/_todo.ts";
import * as config from "../config/config.ts";
import { promptAndValidate } from "../utils/interact.ts";

import type { Args, Command } from "../utils/types.ts";

export const setupCommand: Command = {
  name: "setup",
  description: "Link current directory to an existing module",
  arguments: [{
    name: "[author]",
    description: "A module author",
  }, {
    name: "[module]",
    description: "A module name",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(setupCommand.name, setupCommand);

export async function action(args = Deno.args) {
  const { author, name } = assertFlags(parse(args));

  await setup(author, name);
}

interface Flags {
  author?: string;
  name?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [author, name, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[author]", author, ["string"]);
  checkType("[module]", name, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { author, name } as Flags;
}

// **************** logic ****************

/** Link current directory to an existing module. */
export async function setup(author?: string, name?: string) {
  const user = await config.users.getActive();

  const dirName = basename(Deno.cwd());

  const module = {
    name: name || await promptAndValidate({
      message: "What's the name of your existing module?",
      invalidMessage:
        "The length of a module name must be between 2 and 40 characters.",
      defaultValue: dirName,
      validate: (name) => name.length > 1 && name.length < 41,
    }),
    author: author || await promptAndValidate({
      message: "What's the author of this module?",
      invalidMessage:
        "The length of a username must be more than 0 characters.",
      defaultValue: user.name,
      validate: (name) => name.length > 0,
    }),
  };

  const { meta, ignore } = await downloadConfig(module);
  const project = {
    meta,
    ignore,
    // TODO: fetch api data
    api: {
      versions: [],
      lastPublished: 0,
      latestVersion: "",
    },
    ...module,
    version: "0.0.0",
    lastSync: 0,
    nextAutoSync: 0,
  };

  await config.dir.ensure();
  await config.local.update(project, meta, ignore);

  log.info(
    `Linked to ${cyan(`${module.author}/${module.name}`)} (created ${
      green(".nest")
    })`,
  );
}
