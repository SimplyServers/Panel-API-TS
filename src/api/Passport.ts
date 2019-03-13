import * as passport from "passport";
import { UserModel } from "../schemas/UserSchema";
import passportLocal = require("passport-local");

export class Passport {
  public static bootstrap = () => {
    passport.use(
      new passportLocal.Strategy(
        {
          usernameField: "email",
          passwordField: "password"
        },
        async (usr, pass, done) => {
          let user;
          try {
            user = await UserModel.findOne({ "account_info.email": usr });
          } catch (e) {
            return done(null, false, { message: "Server error" });
          }

          if (await user.validatePassword(pass)) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid username/password" });
          }
        }
      )
    );
  };
}
