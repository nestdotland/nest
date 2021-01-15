import { bold, cyan, gray } from "../deps.ts";
import { log } from "../utilities/log.ts";

const { stdin, stdout, isatty } = Deno;
const LF = "\n".charCodeAt(0);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const separator = gray(">");

/** Shows the given message and waits for the enter key pressed.
 * If the stdin is not interactive, it does nothing. */
export async function alert(message = "Alert", hint = "[Enter]") {
  if (!isatty(stdin.rid)) {
    return;
  }

  await stdout.write(
    encoder.encode(`${bold(`${cyan("i")} ${message}`)} ${hint} ${separator} `),
  );

  await readLineFromStdin();
}

/** Shows the given message and waits for the answer. Returns the user's answer as boolean.
 * Answers that start with y or Y are considered as true.
 * Answers that start with n or N are considered as false.
 * If the stdin is not interactive, it returns false. */
export async function confirm(
  message = "Confirm",
  defaultValue = false,
  { yesHint, noHint } = {
    yesHint: "[Y/n]",
    noHint: "[y/N]",
  },
) {
  if (!isatty(stdin.rid)) {
    return false;
  }

  await stdout.write(
    encoder.encode(
      `${bold(`${cyan("?")} ${message}`)} ${
        defaultValue ? yesHint : noHint
      } ${separator} `,
    ),
  );

  const answer = await readLineFromStdin();

  switch (answer[0]) {
    case "y":
    case "Y":
      return true;

    case "n":
    case "N":
      return false;

    default:
      return defaultValue;
  }
}

/** Shows the given message and waits for the user's input. Returns the user's input as string.
 * If the default value is given and the user inputs the empty string, then it returns the given default value.
 * If the default value is not given and the user inputs the empty string, it returns null. 
 * If the stdin is not interactive, it returns null. */
export async function prompt(message = "Prompt", defaultValue?: string) {
  if (!isatty(stdin.rid)) {
    return "";
  }

  await stdout.write(
    encoder.encode(
      `${bold(`${cyan("?")} ${message}`)}${
        defaultValue ? ` (${defaultValue})` : ""
      } ${separator} `,
    ),
  );

  const answer = await readLineFromStdin();

  return answer.replace(/\r$/, "") || defaultValue;
}

/** Shows the given message and waits for the user's input. Returns the user's input as string.
 * If the given value passed to the `validate` function returns false, repeat the process.
 * Same behavior as the `prompt` function. */
export async function promptAndValidate({
  validate,
  invalidMessage,
  message,
  defaultValue,
}: {
  validate: (res: string) => boolean;
  invalidMessage: string;
  message?: string;
  defaultValue?: string;
}) {
  while (true) {
    const response = (await prompt(message, defaultValue)) || "";

    if (validate(response)) return response;

    log.warning(invalidMessage);
    console.log();
  }
}

export async function readLineFromStdin() {
  const c = new Uint8Array(1);
  const buf = [];

  while (true) {
    const n = await stdin.read(c);
    if (n === 0 || c[0] === LF) {
      break;
    }
    buf.push(c[0]);
  }
  return decoder.decode(new Uint8Array(buf));
}
