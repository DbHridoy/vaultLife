import { Router } from "express";
import { authMiddleware, documentController } from "../../container";
import { upload } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { ConfirmDocumentSchema } from "./document.schema";

const documentRoute = Router();

documentRoute.post(
  "/upload",
  authMiddleware.authenticate,
  upload.single("document"),
  documentController.uploadDocument
);
documentRoute.post(
  "/confirm",
  authMiddleware.authenticate,
  validate(ConfirmDocumentSchema),
  documentController.confirmDocument
);
documentRoute.get("/", authMiddleware.authenticate, documentController.getAllDocuments);
documentRoute.get("/:id", authMiddleware.authenticate, documentController.getDocumentById);

export default documentRoute;
