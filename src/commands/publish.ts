import type { CAC } from "https://unpkg.com/cac@6.6.1/mod.d.ts";
import { setupLog } from "../utilities/log.ts";

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const publishCommand = (nest: CAC) =>
  nest
    .command("publish <dir>", "Remove a dir")
    .option("-r, --recursive", "Remove recursively")
    .action(async (dir, options) => {
      console.log("start");
      await sleep(3000);
      console.log("end");
      console.log("remove " + dir + (options.recursive ? " recursively" : ""));
    });
