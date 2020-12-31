import { generateUUID, Tar } from "../deps.ts";
import { log } from "../utilities/log.ts";
import { underlineBold } from "../utilities/string.ts";
import { NestError } from "../error.ts";
import { publishModule, stageModule } from "../api/todo_.ts";
import type { Meta } from "../utilities/types.ts";
import { readIgnore } from "../config/files/ignore.ts";

export const releaseType = ["patch", "minor", "major"];

export async function publish() {
  const files = await readIgnore();
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

  const response_ = await publishModule(tar.getReader());

  /** Step 4 - do the twig magic locally */
  // TODO
}
