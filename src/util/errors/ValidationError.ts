export class ValidationError extends Error{

    public field;

    constructor(field) {
        super();
        this.message = "Input malformed.";
        this.field = field;
        this.name = "ValidationError"
    }
}
