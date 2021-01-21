import { basename, cyan, ensureDir, green } from "../deps.ts";
import { lineBreak, log } from "../utilities/log.ts";
import { NEST_DIRECTORY } from "../config/files/nest.ts";
import { dataJsonExists, writeDataJson } from "../config/files/data.json.ts";
import { writeModuleJson } from "../config/files/module.json.ts";
import { writeIgnore } from "../config/files/ignore.ts";
import { addToGitIgnore } from "../utilities/git.ts";
import { sync } from "./sync.ts";
import { confirm, prompt, promptAndValidate } from "../utilities/interact.ts";

export async function init(wd = Deno.cwd()) {
  // FIXME: find a better way to determine if a module is already **initialized** and **linked**
  if (await dataJsonExists()) {
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

  // TODO: get username if logged in
  const user = "user";

  if (await confirm("Link to an existing module?")) {
    const name = await promptAndValidate({
      message: "What's the name of your existing module?",
      invalidMessage:
        "The length of a module name must be between 2 and 40 characters.",
      defaultValue: project,
      validate: (name) => name.length > 1 && name.length < 41,
    });

    await sync(name);
    log.info(
      `Linked to ${cyan(`${user}/${name}`)} (created ${
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
    name,
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
    version: "0.0.0",
    lastSync: 0,
    nextAutoSync: 0,
  });
  await writeIgnore(
    "# List here the files and directories to be ignored, one by line as a glob expression.\n\n# Dotfiles are ignored by default.\n.*\n",
  );

  await addToGitIgnore([NEST_DIRECTORY]);

  log.info(
    `Linked to ${cyan(`${user}/${name}`)} (created ${
      green(NEST_DIRECTORY)
    } and added it to ${green(".gitignore")})`,
  );
}
