/* eslint-disable import/no-extraneous-dependencies */
import { Pinecone } from "@pinecone-database/pinecone";
import { embedder } from "./embeddings.ts";
import { getEnv } from "./utils/util.ts";

type Metadata = {
  imagePath: string;
  textHint: string;
};

const indexName = getEnv("PINECONE_INDEX");
const pinecone = new Pinecone();
const index = pinecone.index<Metadata>(indexName);

await embedder.init("Xenova/clip-vit-base-patch32");

const queryImages = async (imagePath: string) => {
  const queryEmbedding = await embedder.embed(imagePath);
  const queryResult = await index.namespace("default").query({
    vector: queryEmbedding.values,
    includeMetadata: true,
    includeValues: true,
    topK: 6,
  });
  return queryResult.matches?.map((match) => {
    const { metadata, id } = match;
    return {
      src: metadata ? metadata.imagePath : "",
      textHint: metadata ? metadata.textHint : "",
      score: match.score,
      id,
    };
  });
};

export { queryImages };
