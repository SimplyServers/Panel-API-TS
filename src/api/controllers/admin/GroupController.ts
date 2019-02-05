import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import Group from "../../../database/models/Group";
import { Storage } from "../../../database/Storage";
import { Models } from "../../../types/Models";
import { ActionFailed } from "../../../util/errors/ActionFailed";
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
          .customSanitizer(Validators.checkJsonArray),
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
          .customSanitizer(Validators.checkJsonArray),
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
      groups = await Storage.getAll({ model: Models.Group });
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
      group = await Storage.getItem({
        model: Models.Group,
        id: req.params.group
      });
    } catch (e) {
      return next(e);
    }

    return res.json({
      group
    });
  };

  public removeGroup = async (req, res, next) => {
    let group;
    try {
      group = await Storage.removeItem({
        model: Models.Group,
        id: req.params.group
      });
    } catch (e) {
      return next(e);
    }

    // Make sure we removed more then 0
    if (group.n < 1) {
      return next(new ActionFailed("Failed to find group matching id", true));
    }

    return res.json({});
  };

  public editGroup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingGroups;
    try {
      existingGroups = await Storage.getItems({model: Models.Group, condition: {
        name: req.body.name
      }});
    } catch (e) {
      return next(e);
    }

    if (existingGroups.length !== 0) {
      // This is expected to be 1, especially if they aren't changing the name
      console.log("ext:" + JSON.stringify(existingGroups[0]));
      if (existingGroups[0]._id.toString() !== req.params.group) {
        // Only fire this if the group we're editing is NOT this
        return next(new ActionFailed("Name already assigned to group.", true));
      }
    } else {
      return next(new ActionFailed("Failed to find group matching id", true));
    }

    const existingGroup = existingGroups[0];

    existingGroup.presetsAllowed = req.body.presetsAllowed;
    existingGroup.color = req.body.color;
    existingGroup.name = req.body.name;
    existingGroup.displayName = req.body.displayName;
    existingGroup.isAdmin = req.body.isAdmin;
    existingGroup.isStaff = req.body.isStaff;

    try {
      await existingGroup.save();
    } catch (e) {
      return next(new ActionFailed("Failed to save group.", false));
    }

    return res.json({
      group: existingGroup
    });
  };

  public addGroup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingGroups;
    try {
      existingGroups = await Storage.getItems({model: Models.Group, condition: {
        name: req.body.name
      }});
    } catch (e) {
      return next(new ActionFailed("Failed checking existing groups.", false));
    }
    if (existingGroups.length !== 0) {
      return next(new ActionFailed("Name already assigned to group.", true));
    }

    // Create the user
    const GroupModal = new Group().getModelForClass(Group);

    const newGroup = new GroupModal({
      color: req.body.color,
      displayName: req.body.displayName,
      name: req.body.name,
      isAdmin: req.body.isAdmin,
      isStaff: req.body.isStaff,
      presetsAllowed: req.body.presetsAllowed
    });

    try {
      await newGroup.save();
    } catch (e) {
      return next(new ActionFailed("Failed to save group.", false));
    }

    return res.json({
      group: newGroup
    });
  };
}
