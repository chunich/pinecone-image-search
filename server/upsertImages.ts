import {
  Pinecone,
  type ServerlessSpecCloudEnum,
} from "@pinecone-database/pinecone";
import { embedAndUpsert } from "./utils/embedAndUpsert.js";
import { getEnv } from "./utils/util.js";
import { embedder } from "./embeddings.ts";

const indexName = getEnv("PINECONE_INDEX");
const pinecone = new Pinecone();
const indexRegion = getEnv("PINECONE_REGION");
const indexCloud = getEnv("PINECONE_CLOUD") as ServerlessSpecCloudEnum;
// Model setup
const modelName = getEnv("MODEL_NAME");
const dimensionSize = getEnv("MODEL_DIMENSION_SIZE") || "128";

const upsertImages = async (imagePaths: string[]) => {
  // Create the index if it doesn't already exist
  const indexList = await pinecone.listIndexes();
  console.log({ indexList });

  if (!indexList.indexes?.some((index) => index.name === indexName)) {
    await pinecone.createIndex({
      // metric: "euclidean",
      name: indexName,
      dimension: parseInt(dimensionSize, 10),
      spec: { serverless: { region: indexRegion, cloud: indexCloud } },
      waitUntilReady: true,
    });
  }
  await embedder.init(modelName);

  const index = pinecone.index(indexName);
  await embedAndUpsert({ imagePaths, chunkSize: 100, index });
};

export { upsertImages };
