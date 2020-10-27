export class CLIError extends Error {
  name = "CLI Error";
  constructor(public message: string) {
    super(message);
  }
}
