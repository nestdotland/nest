/** Child class of `Error`. Used to quickly stop the process.*/
export class NestCLIError extends Error {
  name = "Nest CLI Error";
  constructor(public message: string) {
    super(message);
  }
}
export class NestError extends Error {
  name = "Nest Error";
  constructor(public message: string) {
    super(message);
  }
}
