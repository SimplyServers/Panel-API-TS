import { Types } from "mongoose";
import { ValidationError } from "./errors/ValidationError";

export class Validators {
  public static toObjectIDArray = value => {
    let arr;
    try {
      arr = JSON.parse(value);
    } catch (e) {
      throw new ValidationError(value + " is not valid JSON.");
    }

    if (!(Object.prototype.toString.call(arr) === "[object Array]")) {
      throw new ValidationError(value + " is not an array.");
    }

    return arr.map(s => Types.ObjectId(s));
    // const returnArr = [];
    // arr.forEach(item => {
    //   console.log("pushing item");
    //   try {
    //     returnArr.push(new Types.ObjectId(item));
    //   }catch (e) {
    //     throw new ValidationError(value + " is not an valid objectid.");
    //   }
    // });
    // console.log("return arr:" + JSON.stringify(returnArr))
    // return returnArr;
  };
  public static checkJsonArray = value => {
    const returnArr = [];
    let arr;
    try {
      arr = JSON.parse(value);
    } catch (e) {
      throw new ValidationError(value + " is not valid JSON.");
    }

    if (!(Object.prototype.toString.call(arr) === "[object Array]")) {
      throw new ValidationError(value + " is not an array.");
    }

    // Make sure the JSON is safe
    arr = Validators.mongoSterlize(arr);

    console.log(arr);

    arr.map(val => {
      returnArr.push(val.toString());
    });

    return returnArr;
  };
  // https://github.com/vkarpov15/mongo-sanitize/blob/master/index.js
  public static mongoSterlize(condition: any) {
    if (condition instanceof Object) {
      for (const key in condition) {
        if (/^\$/.test(key)) {
          delete condition[key];
        }
      }
    }
    return condition;
  }
}
