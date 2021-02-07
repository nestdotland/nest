export * from "../mod/deps.ts";

// **************** std ****************
export * from "https://x.nest.land/std@0.85.0/fmt/printf.ts";

export { parse } from "https://x.nest.land/std@0.85.0/flags/mod.ts";
export type { Args } from "https://x.nest.land/std@0.85.0/flags/mod.ts";

export {
  basename,
  dirname,
  globToRegExp,
  join,
  relative,
} from "https://x.nest.land/std@0.85.0/path/mod.ts";

export { walk } from "https://x.nest.land/std@0.85.0/fs/walk.ts";
export { exists } from "https://x.nest.land/std@0.85.0/fs/exists.ts";
export { expandGlob } from "https://x.nest.land/std@0.85.0/fs/expand_glob.ts";
export { ensureFile } from "https://x.nest.land/std@0.85.0/fs/ensure_file.ts";
export { ensureDir } from "https://x.nest.land/std@0.85.0/fs/ensure_dir.ts";

export { readLines } from "https://x.nest.land/std@0.85.0/io/mod.ts";

export { delay } from "https://x.nest.land/std@0.85.0/async/delay.ts";

// **************** hatcher ****************

// export { NestLand } from "https://x.nest.land/hatcher@0.10.1/lib/registries/NestLand.ts";
