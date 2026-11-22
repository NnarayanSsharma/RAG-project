import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config.ts";

const qdrant = new QdrantClient({
    apiKey: config.qdrant.apiKey,
    url: config.qdrant.url,
});

const { collectionName, distance } = config.qdrant;

function paragraphId(documentPath: string, paragraphIndex: number): string {
    const bytes = createHash("sha256")
        .update(JSON.stringify([documentPath, paragraphIndex]))
        .digest()
        .subarray(0, 16);
    // Set the version and variant bits for a custom UUIDv8.
    bytes[6] = (bytes[6] & 0x0f) | 0x80;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString("hex");
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}

export async function storeEmbeddings(filePath: string, chunks: string[], embeddings: number[][]): Promise<void> {
    const { embeddingDimensions } = config.openai;
    if (embeddings.length !== chunks.length) {
        throw new Error(`Invalid embeddings for "${filePath}": expected ${chunks.length} vectors, received ${embeddings.length}.`);
    }
    for (let index = 0; index < chunks.length; index++) {
        const vector = embeddings[index];
        if (!vector || vector.length !== embeddingDimensions) {
            throw new Error(`Invalid embedding for "${filePath}", paragraph ${index + 1}: expected ${embeddingDimensions} dimensions, received ${vector?.length ?? 0}.`);
        }
    }

    const documentPath = resolve(filePath);
    const points = chunks.map((chunk, index) => ({
        id: paragraphId(documentPath, index + 1),
        vector: embeddings[index],
        payload: { text: chunk, filePath, paragraphIndex: index + 1 },
    }));

    const { exists } = await qdrant.collectionExists(collectionName);
    if (!exists) {
        try {
            await qdrant.createCollection(collectionName, {
                vectors: { size: embeddingDimensions, distance },
            });
        } catch (error) {
            // Another indexing run may have created the collection in the meantime.
            if (!(await qdrant.collectionExists(collectionName)).exists) {
                throw error;
            }
        }
    }

    if (points.length === 0) {
        return;
    }

    const existingPoints = await qdrant.retrieve(collectionName, {
        ids: points.map(({ id }) => id),
        with_payload: false,
        with_vector: false,
    });
    const existingIds = new Set(existingPoints.map(({ id }) => id));
    const missingPoints = points.filter(({ id }) => !existingIds.has(id));

    if (missingPoints.length > 0) {
        await qdrant.upsert(collectionName, { points: missingPoints, wait: true });
    }
}
