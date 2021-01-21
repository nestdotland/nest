/** Child class of `Error`. Used to quickly stop the process.*/
export class NestCLIError extends Error {
  name = "Nest CLI Error";
  constructor(public message: string) {
    super(message);
  }
}

export { NestError } from "../lib/error.ts";
