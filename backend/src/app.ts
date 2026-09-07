import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export { app };
