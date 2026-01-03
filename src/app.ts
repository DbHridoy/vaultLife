import express from "express";
import type { Application, Request, Response } from "express";
import { errorHandler } from "./middlewares/error-handler.middleware";
import appRouter from "./routes/index";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { HttpCodes } from "./constants/status-codes";
import cors from "cors";
import { corsOptions } from "./config/cors";
import path from "path";

const app: Application = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Versioned router
app.use("/api/v1", appRouter);

// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

app.get("/api/v1", (req: Request, res: Response) => {
  res.json({ message: "Server is running with version 1" });
});

// Not found handler — LAST
app.use((req: Request, res: Response) => {
  res
    .status(HttpCodes.NotFound)
    .json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

export default app;
