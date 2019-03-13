import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import { PresetService } from "../../../services/admin/PresetService";
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
      if (!rule.path) {
        throw new ActionFailed(
          "Fs value " + JSON.stringify(rule) + " is missing path",
          true
        );
      } else if (rule.canChange === undefined) {
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
        canChange: rule.canChange === true,
        canSee: rule.canSee === true
      });
    });

    return returnArr;
  };
  public getPresets = async (req, res, next) => {
    let presets;
    try {
      presets = await PresetService.get();
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
      preset = await PresetService.getOne(req.params.preset);
    } catch (e) {
      return next(e);
    }

    return res.json({
      preset
    });
  };
  public removePreset = async (req, res, next) => {
    try {
      await PresetService.remove(req.params.preset);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };
  public editPreset = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    await PresetService.edit({
      name: req.body.name,
      game: req.body.game,
      build: {
        mem: req.body.mem,
        io: req.body.io,
        cpu: req.body.cpu
      },
      special: {
        fs: req.body.fs,
        views: req.body.views,
        minecraft: {
          maxPlugins: req.body.maxPlugins
        }
      },
      autoShutdown: req.body.autoShutdown,
      creditsPerDay: req.body.creditsPerDay,
      preinstalledPlugins: req.body.preinstalledPlugins,
      _allowSwitchingTo: req.body.allowSwitchingTo,
      maxPlayers: req.body.maxPlayers
    });

    return res.json({});
  };
  public addPreset = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    await PresetService.add({
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

    return res.json({});
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
        check("_allowSwitchingTo")
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
        check("_allowSwitchingTo")
          .exists()
          .customSanitizer(Validators.toObjectIDArray)
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
}
