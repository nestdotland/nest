import { basename, cyan, green } from "../../deps.ts";
import { log } from "../../utils/log.ts";
import { updateFiles } from "./sync.ts";
import { downloadConfig } from "../../../mod/api/_todo.ts";
import { getActiveUser } from "./login.ts";
import * as config from "../../config/config.ts";
import { promptAndValidate } from "../../utils/interact.ts";

/** Link current directory to an existing module. */
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
  await updateFiles(meta, project, ignore);

  log.info(
    `Linked to ${cyan(`${module.author}/${module.name}`)} (created ${
      green(".nest")
    })`,
  );
  return;
}
