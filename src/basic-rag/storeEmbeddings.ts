import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { QdrantClient } from "@qdrant/js-client-rest";
import * as dotenv from "dotenv";
dotenv.config();

const qdrant = new QdrantClient({
    apiKey: process.env.QDRANT_API_KEY,
    url: process.env.QDRANT_HOST,
});

const collectionName = "people";

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
                vectors: { size: 1536, distance: "Cosine" },
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
