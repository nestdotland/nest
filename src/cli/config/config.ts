import { bold, green, underline } from "../deps.ts";
import { log } from "../utils/log.ts";
import { NestCLIError } from "../utils/error.ts";
import * as project from "./files/project.ts";
import * as ignore from "./files/ignore.ts";
import * as meta from "./files/meta.ts";
import type { Meta, Project } from "../utils/types.ts";

export * as project from "./files/project.ts";
export * as ignore from "./files/ignore.ts";
export * as meta from "./files/meta.ts";
export * as dir from "./files/nest.ts";
export * as users from "./files/users.ts";

export const local = {
  // Will throw if one of the config file is missing.
  async ensureExists(): Promise<void> {
    await ensureFileExists(project);
    await ensureFileExists(meta);
    await ensureFileExists(ignore);
  },
  // Returns the content of config files.
  async get(): Promise<{ project: Project; meta: Meta; ignore: string }> {
    const config = await Promise.all([
      project.parse(),
      meta.parse(),
      ignore.read(),
    ]);
    return {
      project: config[0],
      meta: config[1],
      ignore: config[2],
    };
  },
  // Write to config files with updated properties
  async update(
    projectObj: Project,
    metaObj: Meta,
    ignoreStr: string,
  ): Promise<void> {
    projectObj.meta = metaObj;
    projectObj.ignore = ignoreStr;
    projectObj.lastSync = new Date().getTime();
    await meta.write(metaObj);
    await project.write(projectObj);
    await ignore.write(ignoreStr);
  },
};

interface File {
  exists(): Promise<boolean>;
  FILE: string;
}

async function ensureFileExists(file: File): Promise<void> {
  if (!await file.exists()) {
    log.error(
      underline(bold(file.FILE)),
      "is missing. Fix this issue by running",
      green("nest init"),
    );
    throw new NestCLIError("Missing config file");
  }
}
