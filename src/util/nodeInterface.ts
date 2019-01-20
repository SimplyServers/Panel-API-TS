import * as request from "request-promise";
import * as ServerNode from "../database/models/node"

import * as mongoose from "mongoose";
import * as querystring from "querystring";

export class NodeInterface{
  private readonly node: any;

  constructor(node: mongoose.Schema) {
    this.node = node;
  }

  public query = async () => {

  };

  private post = async (url: string, body: any) => {
    const formData = querystring.stringify(body);

    const headers = {
      'authorization': 'Token ' + this.node.secret
    }
  };
}
