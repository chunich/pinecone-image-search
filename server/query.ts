/* eslint-disable import/no-extraneous-dependencies */
import { Pinecone } from "@pinecone-database/pinecone";
import { embedder } from "./embeddings.ts";
import { getEnv } from "./utils/util.ts";

export type Metadata = {
  imagePath: string;
  name: string;
};

const indexName = getEnv("PINECONE_INDEX");
const pinecone = new Pinecone();
const index = pinecone.index<Metadata>(indexName);
const modelName = getEnv("MODEL_NAME");

await embedder.init(modelName);

const queryImages = async ({ imagePath, name }: Metadata) => {
  const queryEmbedding = await embedder.embed("query", imagePath, name);

  console.log(queryEmbedding.values);
  // TODO: Excludes for now
  const queryFilter = name
    ? {
        name: { $eq: name },
      }
    : {};
  const queryResult = await index.namespace("default").query({
    vector: queryEmbedding.values,
    filter: {},
    includeMetadata: true,
    includeValues: true,
    topK: 6,
  });

  return queryResult.matches?.map((match) => {
    const { metadata, id } = match;
    return {
      src: metadata ? metadata.imagePath : "",
      name: metadata ? metadata.name : "",
      score: match.score,
      id,
    };
  });
};

export { queryImages };
