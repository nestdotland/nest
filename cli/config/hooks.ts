import { cyan } from "../deps.ts";
import { exec } from "../utilities/exec.ts";
import { log } from "../utilities/log.ts";
import { hook } from "../utilities/const.ts";
import { NestCLIError } from "../error.ts";
import * as config from "./config.ts";
import type { Hook } from "../utilities/types.ts";

export type Hooks = {
  [K in Hook]: (action: Promise<unknown>) => Promise<void>;
};

export async function getHooks(): Promise<Hooks> {
  await config.local.ensure();

  const meta = await config.meta.parse();

  const hooks: Partial<Hooks> = {};

  for (const key of hook) {
    hooks[key] = async (action) => {
      const postHook = meta.hooks
        ? meta.hooks[(`post-${key}`) as const]
        : undefined;
      const preHook = meta.hooks
        ? meta.hooks[(`pre-${key}`) as const]
        : undefined;

      if (postHook) {
        log.info(`Executing post ${key} hook: ${cyan(`$ ${postHook}`)} ...`);
        if (await exec(preHook)) {
          log.info("Done.");
        } else {
          log.error("Previous command didn't exit successfully.");
          throw new NestCLIError("Unsuccessful post hook execution (config)");
        }
      }

      await action;

      if (preHook) {
        log.info(`Executing pre ${key} hook: ${cyan(`$ ${preHook}`)} ...`);
        if (await exec(preHook)) {
          log.info("Done.");
        } else {
          log.error("Previous command didn't exit successfully.");
          throw new NestCLIError("Unsuccessful pre hook execution (config)");
        }
      }
    };
  }

  return hooks as Hooks;
}
