import { bold, green, underline } from "../deps.ts";
import { log } from "../utils/log.ts";
import { NestCLIError } from "../utils/error.ts";
import * as project from "./files/project.ts";
import * as ignore from "./files/ignore.ts";
import * as meta from "./files/meta.ts";
import * as jsonDiff from "../processing/json_diff.ts";
import type { Json, Meta, Project } from "../utils/types.ts";

export * as project from "./files/project.ts";
export * as ignore from "./files/ignore.ts";
export * as meta from "./files/meta.ts";
export * as dir from "./files/nest.ts";
export * as users from "./files/users.ts";

export const local = {
  async ensure(): Promise<void> {
    await ensureFile(project);
    await ensureFile(meta);
    await ensureFile(ignore);
  },
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
  unchanged(
    meta1: Meta,
    meta2: Meta,
    ignore1: string,
    ignore2: string,
  ): boolean {
    const diff = jsonDiff.compare(meta1 as Json, meta2 as Json);
    return jsonDiff.isModified(diff) && ignore1 === ignore2;
  },
};

interface File {
  exists(): Promise<boolean>;
  FILE: string;
}

async function ensureFile(file: File): Promise<void> {
  if (!await file.exists()) {
    log.error(
      underline(bold(file.FILE)),
      "is missing. Fix this issue by running",
      green("nest init"),
    );
    throw new NestCLIError("Missing config file");
  }
}
