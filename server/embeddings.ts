import {
  AutoTokenizer,
  AutoProcessor,
  AutoModel,
  RawImage,
  Processor,
  PreTrainedModel,
  PreTrainedTokenizer,
} from "@xenova/transformers";
import type {
  RecordMetadata,
  PineconeRecord,
} from "@pinecone-database/pinecone";
import { createHash } from "crypto";
import { sliceIntoChunks } from "./utils/util.js";

class Embedder {
  private processor: Processor;

  private model: PreTrainedModel;

  private tokenizer: PreTrainedTokenizer;

  async init(modelName: string) {
    // Load the model, tokenizer and processor
    this.model = await AutoModel.from_pretrained(modelName);
    this.tokenizer = await AutoTokenizer.from_pretrained(modelName);
    this.processor = await AutoProcessor.from_pretrained(modelName);
  }

  // Embeds an image and returns the embedding
  async embed(
    action: string,
    imagePath: string,
    name: string, // TODO: HOW TO UTILIZE THIS IN tokenizer?
    metadata?: RecordMetadata
  ): Promise<PineconeRecord> {
    try {
      console.log(`"embed": ${imagePath}`);
      // Load the image
      const image = await RawImage.read(imagePath);
      // Prepare the image and text inputs
      const image_inputs = await this.processor(image);
      // No text inputs

      const input_sentences = [];

      // Index with sentences
      if (action === "index") {
        if (name) {
          input_sentences.push("This is a photo of pokemon monster");
          input_sentences.push("It is a cartoon character");
          input_sentences.push(`Its name is ${name}`);
        } else {
          input_sentences.push("");
        }
      } else {
        // Query with just "name"
        input_sentences.push(name ?? "");
      }

      const text_inputs = this.tokenizer(input_sentences, {
        padding: true,
        truncation: true,
      });
      // Embed the image
      const output = await this.model({ ...text_inputs, ...image_inputs });

      const { image_embeds, text_embeds } = output;
      console.log({ name, imagePath, output });

      const { data: image_embeddings } = image_embeds;
      const { data: text_embeddings } = text_embeds;

      // Adjust as needed
      const imageWeight = 0.3;
      const textWeight = 0.7;

      // Weighted
      const combinedEmbeddings = image_embeddings.map(
        (val: number, i: number) =>
          val * imageWeight + text_embeddings[i] * textWeight
      );

      const values = combinedEmbeddings; // [...image_embeddings, ...text_embeddings];

      // Create an id for the image
      const id = createHash("md5").update(imagePath).digest("hex");

      // Return the embedding in a format ready for Pinecone
      return {
        id,
        metadata: metadata || {
          imagePath,
          name,
        },
        values: Array.from(values) as number[],
      };
    } catch (e) {
      console.log(`Error embedding image, ${e}`);
      throw e;
    }
  }

  // Embeds a batch of documents and calls onDoneBatch with the embeddings
  async embedBatch(
    imagePaths: string[],
    batchSize: number,
    onDoneBatch: (embeddings: PineconeRecord[]) => void
  ) {
    const batches = sliceIntoChunks<string>(imagePaths, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((imagePath) => this.embed("index", imagePath, ""))
      );
      await onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();
export { embedder };
