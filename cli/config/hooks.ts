import { bold, green } from "../deps.ts";
import { exec } from "../utilities/exec.ts";
import { log } from "../utilities/log.ts";
import { hook } from "../utilities/const.ts";
import { NestCLIError } from "../error.ts";
import * as config from "./config.ts";
import type { Hook } from "../utilities/types.ts";

export type Hooks = {
  [K in Hook]: (action: () => Promise<unknown>) => Promise<void>;
};

const prefix = bold(green("$"));

export async function getHooks(): Promise<Hooks> {
  await config.local.ensure();

  const meta = await config.meta.parse();

  const hooks: Partial<Hooks> = {};

  for (const key of hook) {
    hooks[key] = async (action) => {
      const postHook = meta.hooks
        ? meta.hooks[(`post${key}`) as const]
        : undefined;
      const preHook = meta.hooks
        ? meta.hooks[(`pre${key}`) as const]
        : undefined;

      if (preHook) {
        await run(preHook);
      }

      await action();

      if (postHook) {
        await run(postHook);
      }
    };
  }

  return hooks as Hooks;
}

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
