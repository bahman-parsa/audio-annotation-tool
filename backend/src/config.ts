import "dotenv/config";
import path from "node:path";

export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  uploadDir: path.resolve("uploads"),
} as const;
