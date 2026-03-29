import { Router } from "express";
import { authMiddleware, documentController } from "../../container";
import { upload } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { ConfirmDocumentSchema, UpdateDocumentSchema } from "./document.schema";

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
documentRoute.patch(
  "/:id",
  authMiddleware.authenticate,
  validate(UpdateDocumentSchema),
  documentController.updateDocument
);
documentRoute.delete(
  "/:id",
  authMiddleware.authenticate,
  documentController.deleteDocument
);
documentRoute.get("/:id", authMiddleware.authenticate, documentController.getDocumentById);

export default documentRoute;
