import { underline, bold } from "../../deps.ts";

export function highlight(msg: string) {
    return underline(bold(msg));
  }