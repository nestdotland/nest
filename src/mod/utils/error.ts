/** Child class of `Error`. Used to quickly stop the process.*/
export class NestError extends Error {
  name = "Nest Error";
  constructor(public message: string) {
    super(message);
  }
}
