import {
  basename,
  expandGlob,
  globToRegExp,
  join,
  relative,
  walk,
} from "../../deps.ts";
import { log } from "../../utilities/log.ts";
import { IGNORE_PATH, readIgnore } from "../config/ignore.ts";

export interface Ignore {
  accepts: RegExp[];
  denies: RegExp[];
}

export async function parseIgnore(
  read: (path: string) => Promise<string> | string = readIgnore,
  path = IGNORE_PATH,
  wd = Deno.cwd(),
): Promise<Ignore> {
  const ignore: Ignore = {
    accepts: [],
    denies: [],
  };

  const text = await read(path);
  // split text & ignore spaces at the beginning of each line
  const lines = text.split(/\r\n|\r|\n/).map((line) =>
    line.replace(/^\s*/, "")
  );

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // A blank line matches no files, so it can serve as a separator for readability.
    if (line === "") continue;
    // A line starting with # serves as a comment. Put a backslash ("\") in front of
    // the first hash for patterns that begin with a hash.
    if (line.startsWith("#")) continue;
    // An optional prefix "!" which negates the pattern.
    const accepts = line.startsWith("!");
    // An optional prefix "@extends " which imports other ignore files (.gitignore).
    const extended = line.startsWith("@extends ");
    // Trailing spaces are ignored unless they are quoted with backslash ("\").
    line = line.replace(/(?<!\\)\s/g, "").replace(/(?:\\(.))/g, "$1");
    if (accepts) line = line.substr(1);
    if (extended) {
      const pattern = line.substr(8);
      const files = expandGlob(pattern, { root: wd });

      for await (const file of files) {
        const path = join(wd, file.path);
        const { accepts, denies } = await parseIgnore(read, path, wd);
        ignore.accepts.push(...accepts);
        ignore.denies.push(...denies);
      }
      continue;
    }
    // If there is a separator at the beginning or middle (or both) of the pattern,
    // then the pattern is relative to the directory level of the particular ignore file itself.
    // Otherwise the pattern may also match at any level below the ignore file level.
    if (line.replace(/\/$/, "").split("/").length === 1) line = `**/${line}`;
    // If there is a separator at the end of the pattern then the pattern will only match directories,
    // otherwise the pattern can match both files and directories.
    if (line.endsWith("/")) line = `${line}**`;

    try {
      const pattern = globToRegExp(line);
      if (accepts) {
        ignore.accepts.push(pattern);
      } else {
        ignore.denies.push(pattern);
      }
    } catch (err) {
      log.error(`Parsing ${basename(path)} file. Error at line ${i + 1}`);
    }
  }
  return ignore;
}

export async function matchFiles(
  ignore: Ignore,
  wd = Deno.cwd(),
): Promise<string[]> {
  let matched: string[] = [];

  for await (const entry of walk(wd)) {
    if (!entry.isFile) continue;

    const path = "/" + relative(wd, entry.path).replace(/\\/g, "/");
    matched.push(path);
  }

  matched = matched.filter((path) =>
    ignore.denies.some((rgx) => rgx.test(path))
      ? ignore.accepts.some((rgx) => rgx.test(path))
      : true
  );

  return matched;
}
