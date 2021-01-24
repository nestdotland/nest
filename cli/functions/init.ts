import { basename, cyan, ensureDir, green } from "../deps.ts";
import { lineBreak, log } from "../utilities/log.ts";
import { NEST_DIRECTORY } from "../config/nest.ts";
import { dataJsonExists, writeDataJson } from "../config/data.json.ts";
import { moduleJsonExists, writeModuleJson } from "../config/module.json.ts";
import { ignoreExists, writeIgnore } from "../config/ignore.ts";
import { addToGitIgnore } from "../utilities/git.ts";
import { sync } from "./sync.ts";
import { getActiveUser } from "./login.ts";
import { confirm, prompt, promptAndValidate } from "../utilities/interact.ts";

export async function init(wd = Deno.cwd()) {
  const user = await getActiveUser();
  const linked = true; // TODO

  if (
    await dataJsonExists() && await moduleJsonExists() &&
    await ignoreExists() && linked
  ) {
    log.info("Module is already initialized and linked, syncing...");
    await sync();
    return;
  }

  lineBreak();

  const project = basename(wd);

  if (
    !await confirm(`Initialize directory ${green(`${project}/`)} ?`, true)
  ) {
    return;
  }

  if (await confirm("Link to an existing module?")) {
    const module = {
      name: await promptAndValidate({
        message: "What's the name of your existing module?",
        invalidMessage:
          "The length of a module name must be between 2 and 40 characters.",
        defaultValue: project,
        validate: (name) => name.length > 1 && name.length < 41,
      }),
      author: await promptAndValidate({
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
      } and added it to ${green(".gitignore")})`,
    );
    return;
  }

  const name = await promptAndValidate({
    message: "Module name",
    invalidMessage:
      "The length of a module name must be between 2 and 40 characters.",
    defaultValue: project,
    validate: (name) => name.length > 1 && name.length < 41,
  });

  const fullName = await promptAndValidate({
    message: "Module full name",
    invalidMessage:
      "The length of a module name must be longer than 2 characters.",
    defaultValue: name,
    validate: (name) => name.length > 1,
  });

  const description = await prompt("Description");

  const homepage = await prompt("Homepage");

  const license = await prompt("License", "UNKNOWN");

  const meta = {
    fullName,
    description,
    homepage,
    license,
  };

  await ensureDir(NEST_DIRECTORY);
  await writeModuleJson(meta);
  await writeDataJson({
    meta,
    api: {
      versions: [],
      lastPublished: 0,
      latestVersion: "",
    },
    name,
    author: user.name,
    version: "0.0.0",
    lastSync: 0,
    nextAutoSync: 0,
  });
  await writeIgnore(
    "# List here the files and directories to be ignored, one by line as a glob expression.\n\n# Dotfiles are ignored by default.\n.*\n",
  );

  await addToGitIgnore([NEST_DIRECTORY]);

  log.info(
    `Linked to ${cyan(`${user.name}/${name}`)} (created ${
      green(NEST_DIRECTORY)
    } and added it to ${green(".gitignore")})`,
  );
}
