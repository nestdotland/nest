import type { CAC } from "../../deps.ts"
import { setupLog } from "../utilities/log.ts";


export const publishCommand = (nest: CAC) =>
  nest
    .command("publish <dir>", "Remove a dir")
    .option("-r, --recursive", "Remove recursively")
    .action(async (dir, options) => {
      console.log("start");
      console.log("end");
      console.log("remove " + dir + (options.recursive ? " recursively" : ""));
    });
