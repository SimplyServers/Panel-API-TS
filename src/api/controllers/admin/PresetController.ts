import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import Preset, { PresetModel } from "../../../database/Preset";
import { ActionFailed } from "../../../util/errors/ActionFailed";
import { ValidationError } from "../../../util/errors/ValidationError";
import { Validators } from "../../../util/Validators";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class PresetController implements IController {
  public fsValidator = value => {
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

    arr.map(rule => {
      console.log("pulled rule: " + JSON.stringify(rule));
      if (!rule.path) {
        throw new ActionFailed(
          "Fs value " + JSON.stringify(rule) + " is missing path",
          true
        );
      } else if (rule.canChange === undefined) {
        console.log("WTF!");
        throw new ActionFailed(
          "Fs value " + JSON.stringify(rule) + " is missing canChange",
          true
        );
      } else if (rule.canSee === undefined) {
        throw new ActionFailed(
          "Fs value " + JSON.stringify(rule) + " is missing canSee",
          true
        );
      }

      returnArr.push({
        path: rule.path.toString(),
        canChange: rule.canChange.toString(),
        canSee: rule.canSee.toString()
      });
    });

    return returnArr;
  };

  public initRoutes(router: Router): void {
    router.post(
      "/preset/add",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("name")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("game")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("mem")
          .exists()
          .toInt(),
        check("io")
          .exists()
          .toInt(),
        check("cpu")
          .exists()
          .toInt(),
        check("creditsPerDay")
          .exists()
          .toInt(),
        check("maxPlugins")
          .optional()
          .toInt(),
        check("maxPlayers")
          .exists()
          .toInt(),
        check("views")
          .exists()
          .customSanitizer(Validators.checkJsonArray),
        check("allowSwitchingTo")
          .exists()
          .customSanitizer(Validators.toObjectIDArray),
        check("preinstalledPlugins")
          .exists()
          .customSanitizer(Validators.checkJsonArray),
        check("autoShutdown")
          .exists()
          .toBoolean(),
        check("fs")
          .exists()
          .customSanitizer(this.fsValidator)
      ],
      this.addPreset
    );
    router.post(
      "/preset/:preset/edit",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("name")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("game")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("mem")
          .exists()
          .toInt(),
        check("io")
          .exists()
          .toInt(),
        check("cpu")
          .exists()
          .toInt(),
        check("creditsPerDay")
          .exists()
          .toInt(),
        check("maxPlugins")
          .optional()
          .toInt(),
        check("maxPlayers")
          .exists()
          .toInt(),
        check("views")
          .exists()
          .customSanitizer(Validators.checkJsonArray),
        check("preinstalledPlugins")
          .exists()
          .customSanitizer(Validators.checkJsonArray),
        check("autoShutdown")
          .exists()
          .toBoolean(),
        check("fs")
          .exists()
          .customSanitizer(this.fsValidator),
        check("allowSwitchingTo")
          .exists()
          .customSanitizer(Validators.toObjectIDArray),
      ],
      this.editPreset
    );
    router.get(
      "/preset/:preset/remove",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.removePreset
    );
    router.get(
      "/preset/:preset/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getPreset
    );
    router.get(
      "/preset/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getPresets
    );
  }

  public getPresets = async (req, res, next) => {
    let presets;
    try {
      presets = await PresetModel.find({});
    } catch (e) {
      return next(e);
    }

    return res.json({
      presets
    });
  };

  public getPreset = async (req, res, next) => {
    let preset;
    try {
      preset = await PresetModel.findById(req.params.preset).orFail();
    } catch (e) {
      return next(e);
    }

    return res.json({
      preset
    });
  };

  public removePreset = async (req, res, next) => {
    let preset;
    try {
      preset = await PresetModel.findByIdAndDelete(req.params.preset).orFail();
    } catch (e) {
      return next(e);
    }

    // Make sure we removed more then 0
    if (preset.n < 1) {
      return next(new ActionFailed("Failed to find preset matching id", true));
    }

    return res.json({});
  };

  public editPreset = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingPresets;
    try {
      existingPresets = await PresetModel.find({ name: req.body.name });
    } catch (e) {
      return next(e);
    }

    if (existingPresets.length !== 0) {
      // This is expected to be 1, especially if they aren't changing the name
      console.log("ext:" + JSON.stringify(existingPresets[0]));
      if (existingPresets[0]._id.toString() !== req.params.preset) {
        // Only fire this if the preset we're editing is NOT this
        return next(new ActionFailed("Name already assigned to preset.", true));
      }
    } else {
      return next(new ActionFailed("Failed to find preset matching id", true));
    }

    const existingPreset = existingPresets[0];

    existingPreset.name = req.body.name;
    existingPreset.game = req.body.game;
    existingPreset.build.mem = req.body.mem;
    existingPreset.build.io = req.body.io;
    existingPreset.build.cpu = req.body.cpu;
    existingPreset.special.fs = req.body.fs;
    existingPreset.special.views = req.body.views;
    existingPreset.autoShutdown = req.body.autoShutdown;
    existingPreset.creditsPerDay = req.body.creditsPerDay;
    existingPreset.preinstalledPlugins = req.body.preinstalledPlugins;
    existingPreset._allowSwitchingTo = req.body.allowSwitchingTo;
    existingPreset.special.minecraft.maxPlugins = req.body.maxPlugins;
    existingPreset.maxPlayers = req.body.maxPlayers;

    if (req.body.maxPlugins) {
      existingPreset.special.minecraft.maxPlugins = req.body.maxPlugins;
    }

    try {
      await existingPreset.save();
    } catch (e) {
      return next(new ActionFailed("Failed to save preset.", false));
    }

    return res.json({
      preset: existingPreset
    });
  };

  public addPreset = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingPresets;
    try {
      existingPresets = await PresetModel.find({ name: req.body.name });
    } catch (e) {
      return next(new ActionFailed("Failed checking existing presets.", false));
    }
    if (existingPresets.length !== 0) {
      return next(new ActionFailed("Name already assigned to preset.", true));
    }

    const newPreset = new PresetModel({
      name: req.body.name,
      game: req.body.game,
      autoShutdown: req.body.autoShutdown,
      maxPlayers: req.body.maxPlayers,
      build: {
        mem: req.body.mem,
        io: req.body.io,
        cpu: req.body.cpu
      },
      special: {
        fs: req.body.fs,
        views: req.body.views,
        minecraft: {}
      },
      preinstalledPlugins: req.body.preinstalledPlugins,
      _allowSwitchingTo: req.body.allowSwitchingTo,
      creditsPerDay: req.body.creditsPerDay
    });

    if (req.body.maxPlugins) {
      newPreset.special.minecraft.maxPlugins = req.body.maxPlugins;
    }

    try {
      await newPreset.save();
    } catch (e) {
      console.log(e);
      return next(new ActionFailed("Failed to save preset.", false));
    }

    return res.json({
      preset: newPreset
    });
  };
}
