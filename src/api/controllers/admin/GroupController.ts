import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import { Group } from "../../../core/admin/Group";
import { ValidationError } from "../../../util/errors/ValidationError";
import { Validators } from "../../../util/Validators";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { IController } from "../IController";

export class GroupController implements IController {
  public initRoutes(router: Router): void {
    router.post(
      "/group/add",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("presetsAllowed")
          .exists()
          .customSanitizer(Validators.toObjectIDArray),
        check("color")
          .exists()
          .isHexColor(),
        check("name")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("displayName")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("isAdmin")
          .exists()
          .toBoolean(),
        check("isStaff")
          .exists()
          .toBoolean()
      ],
      this.addGroup
    );
    router.post(
      "/group/:group/edit",
      [
        AuthMiddleware.jwtAuth.required,
        AuthMiddleware.isAdmin,
        check("presetsAllowed")
          .exists()
          .customSanitizer(Validators.toObjectIDArray),
        check("color")
          .exists()
          .isHexColor(),
        check("name")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("displayName")
          .exists()
          .isString()
          .isLength({ max: 30 }),
        check("isAdmin")
          .exists()
          .toBoolean(),
        check("isStaff")
          .exists()
          .toBoolean()
      ],
      this.editGroup
    );
    router.get(
      "/group/:group/remove",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.removeGroup
    );
    router.get(
      "/group/:group/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getGroup
    );
    router.get(
      "/group/",
      [AuthMiddleware.jwtAuth.required, AuthMiddleware.isAdmin],
      this.getGroups
    );
  }

  public getGroups = async (req, res, next) => {
    let groups;
    try {
      groups = await Group.get();
    } catch (e) {
      return next(e);
    }

    return res.json({
      groups
    });
  };

  public getGroup = async (req, res, next) => {
    let group;
    try {
      group = await await Group.getOne(req.params.group);
    } catch (e) {
      return next(e);
    }

    return res.json({
      group
    });
  };

  public removeGroup = async (req, res, next) => {
    try {
      await Group.remove(req.params.group);
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public editGroup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    try {
      await Group.edit({
        _presetsAllowed: req.body.presetsAllowed,
        color: req.body.color,
        name: req.body.name,
        displayName: req.body.displayName,
        isAdmin: req.body.isAdmin,
        isStaff: req.body.isStaff,
        _id: req.params.group
      });
    } catch (e) {
      return next(e);
    }

    return res.json({});
  };

  public addGroup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    await Group.add({
      color: req.body.color,
      displayName: req.body.displayName,
      name: req.body.name,
      isAdmin: req.body.isAdmin,
      isStaff: req.body.isStaff,
      _presetsAllowed: req.body.presetsAllowed
    });

    return res.json({});
  }
}
