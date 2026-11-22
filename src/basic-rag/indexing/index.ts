import { chunkDocuments } from "./chunkDocuments.ts";
import { config } from "../config.ts";
import { loadDocuments } from "./loadDocument.ts";

let indexed = 0;
let skipped = 0;
let failed = 0;

try {
    validateConfig();
    const { createEmbeddings } = await import("../common/createEmbeddings.ts");
    const { storeEmbeddings } = await import("./storeEmbeddings.ts");

    for (const filePath of config.documents) {
        let stage = "load";
        try {
            const data = await loadDocuments(filePath);

            stage = "chunk";
            const chunks = chunkDocuments(data);
            if (chunks.length === 0) {
                skipped++;
                console.warn(`[chunk] Skipping "${filePath}": document contains no text.`);
                continue;
            }

            stage = "embed";
            const embeddings = await createEmbeddings(chunks);

            stage = "store";
            await storeEmbeddings(filePath, chunks, embeddings);
            indexed++;
        } catch (error) {
            failed++;
            process.exitCode = 1;
            console.error(`[${stage}] "${filePath}": ${describeError(error)}`);
            if (isSharedFailure(error)) {
                console.error("Stopped indexing because the remaining files depend on the same service.");
                break;
            }
        }
    }
} catch (error) {
    process.exitCode = 1;
    console.error(`[setup] ${describeError(error)}`);
} finally {
    const notProcessed = config.documents.length - indexed - skipped - failed;
    console.log(`Indexing summary: ${indexed} indexed, ${skipped} skipped, ${failed} failed, ${notProcessed} not processed.`);
}

function validateConfig(): void {
    if (!config.openai.apiKey && !process.env.OPENAI_API_KEY) {
        throw new Error("Set OPEN_AI_API_KEY in .env before indexing.");
    }

    if (!config.qdrant.url || !URL.canParse(config.qdrant.url) || !/^https?:\/\//.test(config.qdrant.url)) {
        throw new Error("Set QDRANT_HOST to a full HTTP or HTTPS URL in .env.");
    }
}

function isSharedFailure(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    // The Qdrant client wraps HTTP failures without a numeric status property.
    const status = "status" in error
        ? error.status
        : Number(/^Unexpected Response: (\d{3})\b/.exec(error.message)?.[1]);
    const code = "code" in error ? error.code : undefined;
    return status === 401 || status === 403
        || code === "credit_balance_exhausted" || code === "insufficient_quota";
}

function describeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const credentials = [config.openai.apiKey, process.env.OPENAI_API_KEY, config.qdrant.apiKey];
    return credentials.reduce<string>((safeMessage, key) => key ? safeMessage.replaceAll(key, "[redacted]") : safeMessage, message);
}
