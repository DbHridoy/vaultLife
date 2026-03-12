import { Router } from "express";
import { authMiddleware, supportController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import { CreateSupportSchema, UpdateSupportStatusSchema } from "./support.schema";

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
  validate(UpdateSupportStatusSchema),
  supportController.updateReportStatus
);

export default supportRoute;
