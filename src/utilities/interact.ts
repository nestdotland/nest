import { bold, cyan, gray } from "../deps.ts";
import { log } from "../utilities/log.ts";

const { stdin, stdout, isatty } = Deno;
const LF = "\n".charCodeAt(0);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const separator = gray(">");

export async function alert(message = "Alert", hint = "[Enter]") {
  if (!isatty(stdin.rid)) {
    return;
  }

  await stdout.write(
    encoder.encode(`${bold(`${cyan("i")} ${message}`)} ${hint} ${separator} `),
  );

  await readLineFromStdin();
}

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
