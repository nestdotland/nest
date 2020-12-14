import { bold, underline } from "../deps.ts";

/** Underline & bold */
export function highlight(msg: string) {
  return underline(bold(msg));
}
