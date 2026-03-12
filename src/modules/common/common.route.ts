import { Router } from "express";
import { authMiddleware, commonController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import { CreateCommonSchema, UpdateCommonSchema } from "./common.schema";

const commonRoute = Router();

commonRoute.get("/", commonController.getContent);
commonRoute.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.authorize(["superadmin", "admin"]),
  validate(CreateCommonSchema),
  commonController.createContent
);
commonRoute.patch(
  "/",
  authMiddleware.authenticate,
  authMiddleware.authorize(["superadmin", "admin"]),
  validate(UpdateCommonSchema),
  commonController.updateContent
);

export default commonRoute;
