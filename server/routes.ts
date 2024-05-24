import express from "express";
import { queryImages } from "./query.ts";
import { indexImages } from "./indexImages.ts";

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: express.Request, res: express.Response) => void;
}

const routes: Route[] = [
  {
    route: "/indexImages",
    method: "get",
    handler: async (req, res) => {
      try {
        await indexImages();
        res.status(200).json({ message: "Indexing complete" });
      } catch (error) {
        res.status(500).json({ error: "Error indexing images" });
      }
    },
  },
  {
    route: "/search",
    method: "get",
    handler: async (req, res) => {
      const imagePath = req.query.imagePath as string;
      const name = req.query.name as string;
      console.log("routes", imagePath, name);

      try {
        const matchingImages = await queryImages({ imagePath, name });
        res.json(matchingImages);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Error fetching images", details: error });
      }
    },
  },
];

export { routes as resolvers };
