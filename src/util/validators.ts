import { Storage } from "../database/storage";
import { ValidationError } from "./errors/ValidationError";

export class Validators {
  public static checkJsonArray = (value) => {
    let returnArr = [];
    let arr;
    try {
      arr = JSON.parse(value);
    } catch (e) {
      throw new ValidationError(value + " is not valid JSON.");
    }

    if(!(Object.prototype.toString.call(arr) === '[object Array]')){
      throw new ValidationError(value + " is not an array.");
    }

    // Make sure the JSON is safe
    arr = Storage.mongoSterlize(arr);

    console.log(arr);

    arr.map(val => {
      returnArr.push(val.toString());
    });

    return returnArr;
  };
}