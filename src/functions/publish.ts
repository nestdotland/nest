import { generateUUID, globToRegExp, Tar } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { underlineBold } from "../utilities/string.ts";
import { NestError } from "../error.ts";
import { stageModule } from "../api/todo_.ts";
import type { Meta } from "../utilities/types.ts";
import { ignoreExists, readIgnore } from "./config/ignore.ts";
import type { Ignore } from "./processing/ignore.ts";
import { matchFiles, parseIgnore } from "./processing/ignore.ts";

export const releaseType = ["patch", "minor", "major"];

export async function publish() {
  const ignoreFileExists = await ignoreExists();
  let ignoredFiles: Ignore;

  if (ignoreFileExists) {
    ignoredFiles = await parseIgnore();
  } else {
    log.info(`${underlineBold("ignore")} file not found.`);
    ignoredFiles = await parseIgnore(() => "");
  }

  const files = await matchFiles(ignoredFiles);
}

export async function directPublish(
  meta: Meta,
  version: string,
  files: string[],
  wallet: string,
) {
  const uuid = generateUUID();
  const tar = new Tar();

  /** Step 1 - create a tarball */

  for (const file of files) {
    if (!file.startsWith("/")) {
      log.error(
        `Incorrect file path: ${
          underlineBold(file)
        } It should start with a slash ("/").`,
      );
      throw new NestError("Incorrect file path (publish)");
    }
    try {
      await tar.append(file, {
        filePath: `.${file}`,
      });
    } catch (err) {
      log.error(
        `Unable to append ${underlineBold(file.substr(1))} to the tarball`,
      );
      log.debug(err.stack);
      throw new NestError("Unable to append file to the tarball (publish)");
    }
  }

  /** Step 2 - send the config and uuid to the api */
  // TODO

  const response = await stageModule(meta, uuid);

  /** Step 3 - upload the tarball to arweave */
  // TODO

  const writer = await Deno.open("./out.tar", { write: true, create: true });
  await Deno.copy(tar.getReader(), writer);
  writer.close();

  /** Step 4 - do the twig magic locally */
  // TODO
}
