import { green } from "../deps.ts";
import { log } from "./log.ts";
import { NestCLIError } from "./error.ts";

type Replacer = (key: string, value: unknown) => unknown;

export interface WriteJsonOptions extends Deno.WriteFileOptions {
  replacer?: Array<number | string> | Replacer;
  spaces?: number | string;
}

function serialize(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions,
): string {
  try {
    const jsonString = JSON.stringify(
      object,
      options.replacer as string[],
      options.spaces,
    );
    return `${jsonString}\n`;
  } catch (err) {
    err.message = `${green(filePath)}: ${err.message}`;
    throw err;
  }
}

/** Writes an object to a JSON file. */
export async function writeJson(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions = {},
): Promise<void> {
  const jsonString = serialize(filePath, object, options);
  await Deno.writeTextFile(filePath, jsonString, {
    append: options.append,
    create: options.create,
    mode: options.mode,
  });
}

/** Reads a JSON file and then parses it into an object */
export async function readJson(filePath: string): Promise<unknown> {
  const decoder = new TextDecoder("utf-8");

  const content = decoder.decode(await Deno.readFile(filePath));

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message = `${green(filePath)}: ${err.message}`;
    if (err instanceof SyntaxError) {
      log.error(`Syntax error in ${err.message}`);
      throw new NestCLIError(err.message);
    } else {
      throw err;
    }
  }
}
