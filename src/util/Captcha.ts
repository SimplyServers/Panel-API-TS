import * as request from "request-promise";
import { SimplyServersAPI } from "../ssapi";

export class Captcha {
  public static checkValid = async (ip: string, key: string): Promise<boolean> => {
    const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SimplyServersAPI.config.web.captchaSecret + "&response=" + key + "&remoteip=" + ip;

    let captchaData;
    try{
      captchaData = await request(url);

      captchaData = JSON.parse(captchaData);
    }catch (e) {
      return false;
    }

    return !(captchaData.success === undefined || !captchaData.success);
  }
}
