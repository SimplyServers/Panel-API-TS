import * as request from "request-promise";
import { SimplyServersAPI } from "../SimplyServersAPI";

export interface ICaptchaRequest {
  ip: string,
  key: string
}

export class Captcha {
  public static checkValid = async (
    settings: ICaptchaRequest
  ): Promise<boolean> => {
    const url =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      SimplyServersAPI.config.web.captchaSecret +
      "&response=" +
      settings.key +
      "&remoteip=" +
      settings.ip;

    let captchaData;
    try {
      captchaData = await request(url);

      captchaData = JSON.parse(captchaData);
    } catch (e) {
      return false;
    }

    return !(captchaData.success === undefined || !captchaData.success);
  };
}
