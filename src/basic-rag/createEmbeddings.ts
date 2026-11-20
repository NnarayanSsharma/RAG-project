import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI(
    {
        apiKey: process.env.OPEN_AI_API_KEY,
    }
);


async function createEmbeddings(chunks: string[]): Promise<number[][]> {
    const embeddings = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks,
        encoding_format: "float",
        dimensions: 1536,
    });
    return embeddings.data.map((item) => item.embedding);
}

export { createEmbeddings };
