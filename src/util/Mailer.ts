import * as nodeMailer from "nodemailer";
import * as Mail from "nodemailer/lib/mailer";

import { SimplyServersAPI } from "../SimplyServersAPI";

export class Mailer{

  private transporter: Mail;

  constructor(){
    this.transporter = nodeMailer.createTransport({
      host: SimplyServersAPI.config.email.host,
      port: SimplyServersAPI.config.email.port,
      secure: true,
      auth: {
        user: SimplyServersAPI.config.email.user,
        password: SimplyServersAPI.config.email.password
      }
    })
  }

  public sendPasswordChange = async (to: string) => {
    const body = "We just wanted to confirm with you that you changed your Simply Servers account password.\nIf you didn't make this change, reset your password right away!\n\nThanks, The Simply Servers Team";
    const htmlBody = "<p>We just wanted to confirm with you that you changed your Simply Servers account password.</p><p>If you didn't make this change, reset your password right away!</p><br/><p>Thanks,<br>The Simply Servers Team</p>";
    await this.sendMail(to, "You changed your Simply Servers account password.", body, htmlBody);
  };

  public sendVerify = async (to: string, code: string) => {
    const body = "Your verification code is " + code;
    const htmlBody = "<p>Your verification code is <b>" + code + "</b></p>";
    await this.sendMail(to, "Verify your Simply Servers account", body, htmlBody);
  };

  public sendPasswordReset = async (to: string, code: string) => {
    const body = "Someone requested to reset the password on your Simply Servers account.\n\nClick the link below to reset your password:\nhttps://simplyservers.io/password/reset/" + code + "\n\n\nIf you didn't initate this request, simply ignore this email.";
    const htmlBody = "<p>Someone requested to reset the password on your Simply Servers account.</p><p><a href='https://simplyservers.io/password/reset/" + code + "/'>Click here</a> to reset your password.</p><p>If you didn't initiate this request, simply ignore this email.</p>";
    await this.sendMail(to, "Simply Servers password reset", body, htmlBody);
  };

  private sendMail = async (to: string, subject: string, plainTextBody: string, htmlBody: string) => {
    await this.transporter.sendMail({
      from: '"Simply Servers" <' + SimplyServersAPI.config.email.from + ">",
      to,
      subject,
      text: plainTextBody,
      html: htmlBody
    })
  }
}
