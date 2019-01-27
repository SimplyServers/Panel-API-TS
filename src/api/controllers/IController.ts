import { Router } from "express";

export interface IController {
  initRoutes(router: Router): void;
}
