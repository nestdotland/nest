import { basename, cyan, green, yellow } from "../deps.ts";
import { log } from "../utilities/log.ts";
import * as config from "../config/config.ts";
import { addToGitIgnore } from "../utilities/git.ts";
import { setup } from "./setup.ts";
import { getActiveUser } from "./login.ts";
import { confirm, prompt, promptAndValidate } from "../utilities/interact.ts";

/** Initiate a new module for the nest.land registry */
export async function init() {
  const user = await getActiveUser();

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
