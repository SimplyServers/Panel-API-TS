export class ValidationError extends Error {
  public field: object;

  constructor(field) {
    super();
    this.message = "Input malformed.";
    this.field = field;
    this.name = "ValidationError";
  }
}
