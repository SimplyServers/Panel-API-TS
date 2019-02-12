import * as crypto from "crypto";

export class Util {
  public static generateRandom = (): string => {
    return  crypto
      .randomBytes(Math.ceil(15 / 2))
      .toString("hex")
      .slice(0, 15);
  }
}