import { Router } from "express";
import { authMiddleware, documentController } from "../../container";
import { upload } from "../../middlewares/upload.middleware";

const documentRoute = Router();

documentRoute.post(
  "/upload",
  authMiddleware.authenticate,
  upload.single("document"),
  documentController.uploadDocument
);
documentRoute.get("/", authMiddleware.authenticate, documentController.getAllDocuments);
documentRoute.get("/:id", authMiddleware.authenticate, documentController.getDocumentById);

export default documentRoute;
