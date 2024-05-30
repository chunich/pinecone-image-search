import express, { Request, Response, Router } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";

import { existsSync } from "fs";
import { resolvers } from "./routes.ts";
import { getEnv } from "./utils/util.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: express.Application = express();
const port: string | number = process.env.PORT || 3000;
const isProd: boolean = process.env.NODE_ENV === "production";
const folder = getEnv("IMAGE_SOURCE_FOLDER");

if (isProd) {
  const buildPath: string = path.resolve(__dirname, "app/dist");
  if (existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.resolve(buildPath, "index.html"));
    });
  } else {
    console.log(
      "Production build not found. Run `yarn build` in `src/app` directory."
    );
  }
} else {
  const router = Router();

  console.log({ resolvers });

  resolvers.forEach((resolver) => {
    router[resolver.method](resolver.route, resolver.handler);
  });

  app.use(cors());
  app.use(router);

  app.use("/data", express.static(join(__dirname, `.${folder}`)));

  app.use(
    "/",
    createProxyMiddleware({
      target: "http://localhost:5173/",
      changeOrigin: true,
      ws: true,
    })
  );
}

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
