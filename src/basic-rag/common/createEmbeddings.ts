import OpenAI from "openai";
import { config } from "../config.ts";

const openai = new OpenAI(
    {
        apiKey: config.openai.apiKey,
    }
);


async function createEmbeddings(chunks: string[]): Promise<number[][]> {
    const embeddings = await openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: chunks,
        encoding_format: config.openai.embeddingEncoding,
        dimensions: config.openai.embeddingDimensions,
    });
    return embeddings.data.map((item) => item.embedding);
}

export { createEmbeddings };
