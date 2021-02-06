import {
  basename,
  expandGlob,
  globToRegExp,
  join,
  readLines,
  relative,
  walk,
} from "../deps.ts";
import { log } from "../utils/log.ts";
import { NestError } from "../utils/error.ts";

interface Accepts {
  status: "accepts";
  value: RegExp;
}

interface Denies {
  status: "denies";
  value: RegExp;
}

interface Extends {
  status: "extends";
  value: string;
}

export type ParsedResult = Accepts | Denies | Extends | undefined;

export class Ignore {
  public accepted: RegExp[] = [];
  public denied: RegExp[] = [];

  readonly fileParsed: string[] = [];
  readonly parsingProcess: Promise<void>;

  constructor(path: string, readonly wd = Deno.cwd()) {
    this.parsingProcess = this.parse(join(this.wd, path));
  }

  static parseLine(line: string): ParsedResult {
    // ignore spaces at the beginning of the line
    line = line.replace(/^\s*/, "");

    // A blank line matches no files, so it can serve as a separator for readability.
    if (line === "") return;
    // A line starting with # serves as a comment. Put a backslash ("\") in front of
    // the first hash for patterns that begin with a hash.
    if (line.startsWith("#")) return;
    // An optional prefix "!" which negates the pattern.
    const accepted = line.startsWith("!");
    // An optional prefix "@extends " which imports other ignore files (.gitignore).
    const extended = line.startsWith("@extends ");

    if (accepted) line = line.substr(1);
    if (extended) line = line.substr(8);

    // Trailing spaces are ignored unless they are quoted with backslash ("\").
    line = line.replace(/(?<!\\)\s/g, "").replace(/(?:\\(.))/g, "$1");

    // If there is a separator at the beginning or middle (or both) of the pattern,
    // then the pattern is relative to the directory level of the particular ignore file itself.
    // Otherwise the pattern may also match at any level below the ignore file level.
    line = line.replace(/\/$/, "").split("/").length === 1
      ? `**/${line}`
      : `/${line}`;
    // If there is a separator at the end of the pattern then the pattern will only match directories,
    // otherwise the pattern can match both files and directories.
    const matchDirsOnly = line.endsWith("/");
    if (matchDirsOnly) line = `${line}**`;

    if (extended) {
      return {
        status: "extends",
        value: line,
      };
    }
    return {
      status: accepted ? "accepts" : "denies",
      value: matchDirsOnly ? globToRegExp(line) : new RegExp(
        `${globToRegExp(line).source}|${globToRegExp(`${line}/**`).source}`,
      ),
    };
  }

  protected fileRules(path: string) {
    if (path.match(/.gitignore$/)) this.denied.push(globToRegExp(".git*/**"));
  }

  protected async parse(path: string) {
    if (this.fileParsed.includes(path)) return;
    this.fileParsed.push(path);
    this.fileRules(path);

    const fileReader = await Deno.open(path);

    const extended: Promise<void>[] = [];

    let lineNumber = 1;
    let parsingError = false;
    for await (const line of readLines(fileReader)) {
      let result: ParsedResult;

      try {
        result = Ignore.parseLine(line);
      } catch (err) {
        log.error(
          `Parsing ${basename(path)} file. Error at line ${lineNumber}`,
        );
        log.debug(err);
        parsingError = true;
      }

      if (result) {
        switch (result.status) {
          case "accepts":
            this.accepted.push(result.value);
            break;

          case "denies":
            this.denied.push(result.value);
            break;

          case "extends": {
            const files = expandGlob(result.value, { root: this.wd });
            for await (const file of files) {
              extended.push(this.parse(file.path));
            }
            break;
          }
        }
      }
      lineNumber++;
    }

    fileReader.close();
    await Promise.all(extended);
    if (parsingError) throw new NestError("Unable to parse file (ignore)");
  }

  async matchFiles(): Promise<string[]> {
    await this.parsingProcess;

    let matched: string[] = [];

    for await (const entry of walk(this.wd)) {
      if (!entry.isFile) continue;

      const path = "/" + relative(this.wd, entry.path).replace(/\\/g, "/");
      matched.push(path);
    }

    matched = matched.filter((path) =>
      this.denied.some((rgx) => rgx.test(path))
        ? this.accepted.some((rgx) => rgx.test(path))
        : true
    );

    return matched;
  }
}
