export class NestCLIError extends Error {
  name = "Nest CLI Error";
  constructor(public message: string) {
    super(message);
  }
}
