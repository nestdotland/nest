import { bold, green } from "../deps.ts";
import { exec } from "../utils/exec.ts";
import { lineBreak, log } from "../utils/log.ts";
import { hook } from "../utils/const.ts";
import { NestCLIError } from "../utils/error.ts";
import * as config from "./config.ts";
import type { Hook } from "../utils/types.ts";

/** Will execute the pre hook, the action then the post hook */
export type Hooks = {
  [K in Hook]: (action: () => Promise<unknown>) => Promise<void>;
};

const prefix = bold(green("$"));

/** A wrapper around hooks */
export async function getHooks(): Promise<Hooks> {
  await config.local.ensureExists();

  const meta = await config.meta.parse();

  const hooks: Partial<Hooks> = {};

  for (const key of hook) {
    hooks[key] = async (action) => {
      const preHook = meta.hooks
        ? meta.hooks[(`pre${key}`) as const]
        : undefined;
      const postHook = meta.hooks
        ? meta.hooks[(`post${key}`) as const]
        : undefined;

      if (preHook) {
        await run(preHook);
        lineBreak();
      }

      await action();

      if (postHook) {
        lineBreak();
        await run(postHook);
      }
    };
  }

  return hooks as Hooks;
}

/** Runs the given command, throws if unsuccessful. */
async function run(command: string) {
  log.plain(prefix, command);

  const t0 = performance.now();
  const statusCode = await exec(command);
  const t1 = performance.now();

  if (statusCode === 0) {
    const seconds = (t1 - t0) / 1000;
    log.info(`Done in ${seconds.toFixed(3)}s.`);
  } else {
    log.error(`Command failed with exit code ${statusCode}.`);
    throw new NestCLIError("Unsuccessful post hook execution (config)");
  }
}
