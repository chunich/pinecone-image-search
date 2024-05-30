import express from "express";
import multer from "multer";
import { queryImages } from "./query.ts";
import { indexImages } from "./indexImages.ts";
import { deleteImage } from "./deleteImage.ts";
import { upsertImages } from "./upsertImages.ts";
import { listFiles, getEnv } from "./utils/util.ts";

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: express.Request, res: express.Response) => void;
}

function getImagesInRange(
  page: number,
  pageSize: number,
  imagePaths: string[]
): string[] {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return imagePaths.slice(start, end);
}

// Save newly uploaded images to the data directory; Use .single('images') for 1 file
const upload = multer({ dest: "data/" }).array("images");

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
  {
    route: "/uploadImages",
    method: "post",
    handler: async (req, res) => {
      upload(req, res, async (err) => {
        if (err) {
          res.status(500).json({ error: "Error uploading images" });
          return;
        }

        if (!req.files || req.files.length === 0) {
          res.status(400).json({ error: "No files uploaded" });
          return;
        }

        // upload.single() - Single file check {req.file}
        // if (!req.file) {
        //   res.status(400).json({ error: "No files uploaded" });
        //   return;
        // }

        const uploadedImagePaths = (req.files as Express.Multer.File[]).map(
          (file) => `${file.path}`
        );

        console.log({ uploadedImagePaths });

        const folder = getEnv("IMAGE_SOURCE_FOLDER");

        try {
          await upsertImages(uploadedImagePaths);
          // Return the page number of the first image uploaded (for demo purposes)
          const imagePaths = await listFiles(folder);
          const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
          const pageOfFirstImage =
            Math.floor(imagePaths.indexOf(uploadedImagePaths[0]) / pageSize) +
            1;
          res.status(200).json({ pageOfFirstImage });
        } catch (error) {
          res.status(500).json({ error: "Error uploading images" });
        }
      });
    },
  },
  {
    route: "/deleteImage",
    method: "delete",
    handler: async (req, res) => {
      const imagePath = req.query.imagePath as string;

      try {
        await deleteImage(imagePath);
        res.status(200).json({ message: "Image deleted" });
      } catch (error) {
        res.status(500).json({ error: "Error deleting image" });
      }
    },
  },
];

export { routes as resolvers };
