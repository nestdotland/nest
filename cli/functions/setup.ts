import { basename, cyan, green } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { sync } from "./sync.ts";
import { getActiveUser } from "./login.ts";
import { promptAndValidate } from "../utilities/interact.ts";

export async function setup(author?: string, name?: string) {
  const user = await getActiveUser();

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

  await sync(module);

  log.info(
    `Linked to ${cyan(`${module.author}/${module.name}`)} (created ${
      green(".nest")
    })`,
  );
  return;
}
