/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable dot-notation */
import * as dotenv from "dotenv";
import {
  Pinecone,
  type PineconeRecord,
  type ServerlessSpecCloudEnum,
} from "@pinecone-database/pinecone";
import { embedder } from "./embeddings.ts";
import { getEnv, listFiles } from "./utils/util.ts";
import { chunkedUpsert } from "./utils/chunkedUpsert.ts";

dotenv.config();

// Index setup
const indexName = getEnv("PINECONE_INDEX");
const indexCloud = getEnv("PINECONE_CLOUD") as ServerlessSpecCloudEnum;
const indexRegion = getEnv("PINECONE_REGION");
const pinecone = new Pinecone();
// Model setup
const modelName = getEnv("MODEL_NAME");
const dimensionSize = getEnv("MODEL_DIMENSION_SIZE") || "128";

function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

async function embedAndUpsert({
  imagePaths,
  chunkSize,
}: {
  imagePaths: string[];
  chunkSize: number;
}) {
  // Chunk the image paths into batches of size chunkSize
  const chunkGenerator = chunkArray(imagePaths, chunkSize);

  // Get the index
  const index = pinecone.index(indexName);

  // Embed each batch and upsert the embeddings into the index
  for await (const imagePaths of chunkGenerator) {
    await embedder.embedBatch(
      imagePaths,
      chunkSize,
      async (embeddings: PineconeRecord[]) => {
        await chunkedUpsert(index, embeddings, "default");
      }
    );
  }
}

const indexImages = async () => {
  try {
    console.log("Entering indexImages.....");
    // Create the index if it doesn't already exist
    const indexList = await pinecone.listIndexes();
    console.log({ indexList });

    if (!indexList.indexes?.some((index) => index.name === indexName)) {
      await pinecone.createIndex({
        name: indexName,
        dimension: parseInt(dimensionSize, 10),
        spec: { serverless: { region: indexRegion, cloud: indexCloud } },
        waitUntilReady: true,
      });
    }
    await embedder.init(modelName);

    const imagePaths = await listFiles("./data");

    // Limit # of images to index ($$$ saving)
    const filteredImagePaths = imagePaths.filter((img) =>
      [
        "Bellsprout-1ef0add51b1940639726dc02e3b344a7_jpg.rf.967640ae20af70a105fc826a0bbf09f2",
        "Chansey-732d239d00e04c2ea612e04d1065f5d6_jpg.rf.37fed6af496cd0d920f05f19dd2ee5ed",
        "Chansey-4f244b49f1f74aa78cfdc6b5f1f983a0_jpg.rf.34f41a60c5f0f27cad47ab2207f02132",
        "Beedrill-2fd93e226abc4937a5669c56192d9f7d_jpg.rf.ce664c811a62d6eb75903aaa538a2fbd",
        "Butterfree-f62f047aec23439dbac01fa9deee1de0_jpg.rf.5f30fdec55b865bb8af86b568f22965c",
        "Bulbasaur-00000000_png.rf.dcf9405891ffc91f63b3de6c2d5cb419",
      ].some((entry) => img.includes(entry))
    );

    await embedAndUpsert({ imagePaths: filteredImagePaths, chunkSize: 100 });
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { indexImages };
