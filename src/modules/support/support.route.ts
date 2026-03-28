import { Router } from "express";
import { authMiddleware, supportController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import {
  CreateSupportSchema,
  ResolveSupportReportSchema,
  UpdateSupportStatusSchema,
} from "./support.schema";
import { upload } from "../../middlewares/upload.middleware";

const supportRoute = Router();

supportRoute.use(authMiddleware.authenticate);
supportRoute.post("/", validate(CreateSupportSchema), supportController.createReport);
supportRoute.get("/me", supportController.getMyReports);
supportRoute.get(
  "/",
  authMiddleware.authorize(["superadmin", "admin"]),
  supportController.getAllReports
);
supportRoute.get(
  "/:id",
  authMiddleware.authorize(["superadmin", "admin"]),
  supportController.getReportById
);
supportRoute.patch(
  "/:id/status",
  authMiddleware.authorize(["superadmin", "admin"]),
  upload.array("attachments", 5),
  validate(UpdateSupportStatusSchema),
  supportController.updateReportStatus
);
supportRoute.patch(
  "/:id/resolve",
  authMiddleware.authorize(["superadmin", "admin"]),
  upload.array("attachments", 5),
  validate(ResolveSupportReportSchema),
  supportController.resolveReport
);

export default supportRoute;
