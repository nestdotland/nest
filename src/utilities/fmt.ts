import { bold, underline } from "../../deps.ts";

export function highlight(msg: string) {
  return underline(bold(msg));
}
