import { Router } from "express";
import { check, validationResult } from "express-validator/check";
import Group from "../../../database/models/group";
import { Storage } from "../../../database/storage";
import { Models } from "../../../types/models";
import { ActionFailed } from "../../../util/errors/ActionFailed";
import { ValidationError } from "../../../util/errors/ValidationError";
import { Validators } from "../../../util/validators";
import { AuthMiddleware } from "../../middleware/auth";
import { IController } from "../IController";

export class GroupController implements IController {
  public initRoutes(router: Router): void {
    router.post("/group/add", [
      AuthMiddleware.jwtAuth.required,
      AuthMiddleware.isAdmin,
      check("presetsAllowed").exists(),
      check("presetsAllowed").customSanitizer(Validators.checkJsonArray),
      check("color").exists(),
      check("color").isHexColor(),
      check("name").exists(),
      check("name").isLength({ max: 30 }),
      check("displayName").exists(),
      check("displayName").isLength({ max: 30 }),
      check("isAdmin").exists(),
      check("isAdmin").toBoolean(),
      check("isStaff").exists(),
      check("isStaff").toBoolean()
    ], this.addGroup);
    router.post("/group/:group/edit", [
      AuthMiddleware.jwtAuth.required,
      AuthMiddleware.isAdmin,
      check("presetsAllowed").exists(),
      check("presetsAllowed").customSanitizer(Validators.checkJsonArray),
      check("color").exists(),
      check("color").isHexColor(),
      check("name").exists(),
      check("name").isLength({ max: 30 }),
      check("displayName").exists(),
      check("displayName").isLength({ max: 30 }),
      check("isAdmin").exists(),
      check("isAdmin").toBoolean(),
      check("isStaff").exists(),
      check("isStaff").toBoolean()
    ], this.editGroup);
    router.get("/group/:group/remove", [
      AuthMiddleware.jwtAuth.required,
      AuthMiddleware.isAdmin,
    ], this.removeGroup);
    router.get("/group/:group/", [
      AuthMiddleware.jwtAuth.required,
      AuthMiddleware.isAdmin,
    ], this.getGroup);
    router.get("/group/", [
      AuthMiddleware.jwtAuth.required,
      AuthMiddleware.isAdmin,
    ], this.getGroups);
  };

  public getGroups = async (req, res, next) => {
    let groups;
    try{
      groups = await Storage.getAll(Models.Group);
    }catch (e) {
      return next(e);
    }

    return res.json({
      groups
    })
  };

  public getGroup = async (req, res, next) => {
    let group;
    try{
      group = await Storage.getItem(Models.Group, req.params.group);
    }catch (e) {
      return next(e);
    }

    return res.json({
      group
    })
  };

  public removeGroup = async (req, res, next) => {
    let group;
    try {
      group = await Storage.removeItem(Models.Group, req.params.group);
    } catch (e) {
      return next(e);
    }

    // Make sure we removed more then 0
    if (group.n < 1) {
      return next(new ActionFailed('Failed to find group matching id', true));
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
      existingGroups = await Storage.getItems(Models.Group, {name: req.body.name});
    } catch (e) {
      return next(e);
    }

    if (existingGroups.length !== 0) {
      // This is expected to be 1, especially if they aren't changing the name
      console.log("ext:" + JSON.stringify(existingGroups[0]));
      if (existingGroups[0]._id.toString() !== req.params.group) { // Only fire this if the group we're editing is NOT this
        return next(new ActionFailed("Name already assigned to group.", true));
      }
    }else{
      return next(new ActionFailed("Failed to find group matching id", true));
    }

    const existingGroup = existingGroups[0];

    existingGroup.presetsAllowed = req.body.presetsAllowed;
    existingGroup.color = req.body.color;
    existingGroup.name = req.body.name;
    existingGroup.displayName = req.body.displayName;
    existingGroup.isAdmin = req.body.isAdmin;
    existingGroup.isStaff = req.body.isStaff;

    try{
      await existingGroup.save();
    }catch (e) {
      return next(new ActionFailed('Failed to save group.', false));
    }

    return res.json({
      group:existingGroup
    })

  };

  public addGroup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }

    // Make sure the name isn't already assigned
    let existingGroups;
    try {
      existingGroups = await Storage.getItems(Models.Group, { name: req.body.name });
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
      name: req.body.name,
      displayName: req.body.displayName,
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
