import { Storage } from "./database/Storage";
import { SimplyServersAPI } from "./SimplyServersAPI";
import { Models } from "./types/Models";
import { NodeInterface } from "./util/NodeInterface";

export class NodeUpdater {
  public enabled: boolean;
  private checkInterval: any;

  constructor() {
    this.enabled = false;
    this.checkInterval = undefined;
  }

  public stop = () => {
    if (!this.enabled || this.checkInterval === undefined) {
      return;
    }

    clearInterval(this.checkInterval);
    this.enabled = false;
  };

  public start = () => {
    if (this.enabled) {
      return;
    }

    SimplyServersAPI.logger.info("Test");

    // We ignore the promise but that's fine
    this.checkInterval = setInterval(this.check, 1000 * 60 * 3);
    // this.checkInterval = setInterval(this.check, 1000 * 10);
  };

  private check = async () => {
    SimplyServersAPI.logger.verbose("Updating nodes");
    const nodes = await Storage.getAll({ model: Models.Node });

    await Promise.all(
      nodes.map(async node => {
        const nodeInterface = new NodeInterface(node);

        let queryResults: any;
        try {
          queryResults = await nodeInterface.query();

          SimplyServersAPI.logger.verbose("Updated node info:" + JSON.stringify(queryResults));

          node.plugins = await nodeInterface.getPlugins();
          node.games = await nodeInterface.games();
        } catch (e) {
          console.log("here!");
          SimplyServersAPI.logger.error("Failed to ping node: " + e);
          return;
        }

        node.status = {
          lastOnline: Date.now().valueOf(),
          cpu: queryResults.cpu,
          totalmem: queryResults.totalmem,
          totaldisk: queryResults.totaldisk,
          freedisk: queryResults.freedisk
        };

        try {
          await node.save();
        }catch (e) {
          SimplyServersAPI.logger.error("Failed to save node update: "  + e);
          return;
        }

        SimplyServersAPI.logger.verbose("Updated info for node " + node._id);
      })
    );
  };
}
