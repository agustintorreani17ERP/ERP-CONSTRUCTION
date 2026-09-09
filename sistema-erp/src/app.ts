import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", service: "infra-erp" } });
  });

  app.use("/api", apiRouter);
  app.use(errorHandler);
  return app;
}
