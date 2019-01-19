export class ActionFailed extends Error{

    public showInProd;

    constructor(message, prod) {
        super();
        this.showInProd = prod;
        this.message = message;
        this.name = "ActionFailed";
    }
}
