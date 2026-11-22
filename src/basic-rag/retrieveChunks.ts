import { QdrantClient } from "@qdrant/js-client-rest";
import "dotenv/config";

const qdrant = new QdrantClient({
    apiKey: process.env.QDRANT_API_KEY,
    url: process.env.QDRANT_HOST,
});

export async function retrieveChunks(queryEmbedding: number[], limit = 4): Promise<any[]> {
    const results = await qdrant.query("people", {
        query: queryEmbedding,
        with_payload: true,
        limit,
    });

    return results.points;
}
