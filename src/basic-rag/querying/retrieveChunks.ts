import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config.ts";

const qdrant = new QdrantClient({
    apiKey: config.qdrant.apiKey,
    url: config.qdrant.url,
});

export async function retrieveChunks(queryEmbedding: number[], limit: number = config.qdrant.retrievalLimit): Promise<any[]> {
    const results = await qdrant.query(config.qdrant.collectionName, {
        query: queryEmbedding,
        with_payload: true,
        limit,
    });

    return results.points;
}
