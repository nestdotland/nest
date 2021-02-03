import { log, underlineBold } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import { green } from "../deps.ts";
import * as project from "./files/project.ts";
import * as ignore from "./files/ignore.ts";
import * as meta from "./files/meta.ts";

export * as project from "./files/project.ts";
export * as ignore from "./files/ignore.ts";
export * as meta from "./files/meta.ts";
export * as dir from "./files/nest.ts";
export * as users from "./files/users.ts";

export const local = {
  ensure: async function (): Promise<void> {
    await ensureFile(project);
    await ensureFile(meta);
    await ensureFile(ignore);
  },
};

interface File {
  exists(): Promise<boolean>;
  FILE: string;
}

async function ensureFile(file: File): Promise<void> {
  if (!await file.exists()) {
    log.error(
      underlineBold(file.FILE),
      "is missing. Fix this issue by running",
      green("nest init"),
    );
    throw new NestCLIError("Missing config file");
  }
}
