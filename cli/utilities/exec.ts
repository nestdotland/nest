export async function exec(command: string): Promise<number> {
  const process = Deno.run({
    cmd: tokenize(command),
  });

  const status = await process.status();
  return status.code;
}

enum TokenState {
  NONE,
  NORMAL,
  SINGLE_QUOTE,
  DOUBLE_QUOTE,
}

/** Tokenizes the given string.
 * Returns a list of parsed and properly escaped arguments. */
export function tokenize(text: string): string[] {
  const argList: string[] = [];
  let currArg = "";
  let escaped = false;

  // start in the NO_TOKEN_STATE
  let state = TokenState.NONE;

  // Loop over each character in the string
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if (escaped) {
      // Escaped state: just append the next character to the current arg.
      escaped = false;
      currArg += c;
    } else {
      switch (state) {
        case TokenState.SINGLE_QUOTE:
          if (c === "'") {
            // Seen the close quote; continue this arg until whitespace is seen
            state = TokenState.NORMAL;
          } else {
            currArg += c;
          }
          break;
        case TokenState.DOUBLE_QUOTE:
          if (c === '"') {
            // Seen the close quote; continue this arg until whitespace is seen
            state = TokenState.NORMAL;
          } else if (c === "\\") {
            // Look ahead, and only escape quotes or backslashes
            const next = text.charAt(++i);
            if (next === '"' || next === "\\") {
              currArg += next;
            } else {
              currArg += c + next;
            }
          } else {
            currArg += c;
          }
          break;
        case TokenState.NONE:
        case TokenState.NORMAL:
          switch (c) {
            case "\\":
              escaped = true;
              state = TokenState.NORMAL;
              break;
            case "'":
              state = TokenState.SINGLE_QUOTE;
              break;
            case '"':
              state = TokenState.DOUBLE_QUOTE;
              break;
            default:
              if (!c.match(/\s/)) {
                currArg += c;
                state = TokenState.NORMAL;
              } else if (state === TokenState.NORMAL) {
                // Whitespace ends the token; start a new one
                argList.push(currArg);
                currArg = "";
                state = TokenState.NONE;
              }
          }
          break;
      }
    }
  }
  // If we're still escaped, put in the backslash
  if (escaped) {
    currArg += "\\";
    argList.push(currArg);
  } else if (state !== TokenState.NONE) {
    // Close the last argument if we haven't yet
    argList.push(currArg);
  }
  return argList;
}
