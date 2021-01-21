import { log, underlineBold } from "../../utilities/log.ts";
import { NestCLIError } from "../../error.ts";
import { green } from "../../deps.ts";
import { DATA_FILE, dataJsonExists } from "./data.json.ts";
import { IGNORE_FILE, ignoreExists } from "./ignore.ts";
import { MODULE_FILE, moduleJsonExists } from "./module.json.ts";

export async function ensureConfig(): Promise<void> {
  if (!await moduleJsonExists()) {
    log.error(
      `${underlineBold(MODULE_FILE)} is missing. Fix this issue by running ${
        green("nest init")
      }`,
    );
    throw new NestCLIError("Missing config file");
  }
  if (!await dataJsonExists()) {
    log.error(
      `${underlineBold(DATA_FILE)} is missing. Fix this issue by running ${
        green("nest init")
      }`,
    );
    throw new NestCLIError("Missing config file");
  }
  if (!await ignoreExists()) {
    log.error(
      `${underlineBold(IGNORE_FILE)} is missing. Fix this issue by running ${
        green("nest init")
      }`,
    );
    throw new NestCLIError("Missing config file");
  }
}
