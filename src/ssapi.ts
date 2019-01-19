import {Logger} from "./util/logger";

export class SimplyServersAPI{
    static logger: Logger;

    constructor(){
        SimplyServersAPI.logger = new Logger(false);
        SimplyServersAPI.logger.info("Bootstrapping");
        this.bootstrap().then(() => {
            SimplyServersAPI.logger.info("Bootstrap done");
        }).catch(() => {

        });
    };

    private bootstrap = async (): Promise<void> => {
        SimplyServersAPI.logger.info("Bootstrap init");
    };

    public static getRoot = (): string => {
        return __dirname;
    };
}
