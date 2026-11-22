import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { QdrantClient } from "@qdrant/js-client-rest";

process.env.OPEN_AI_API_KEY = "indexing-test-openai-key";
process.env.QDRANT_HOST = "https://qdrant.example";
process.env.QDRANT_API_KEY = "indexing-test-qdrant-key";

const { config } = await import("../config.ts");
const { chunkDocuments } = await import("./chunkDocuments.ts");
const { loadDocuments } = await import("./loadDocument.ts");
const documents = config.documents as readonly string[] as string[];

test("splits whitespace-only separators and preserves wrapped lines", () => {
    assert.deepEqual(chunkDocuments("First\r\nwrapped\r\n \t\r\nSecond"), ["First\r\nwrapped", "Second"]);
    assert.deepEqual(chunkDocuments(" \n\t\n "), []);
});

test("reports per-file failures, continues indexing, and stops on shared authentication failures", async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "rag-index-"));
    const previousExitCode = process.exitCode;
    const originalDocuments = [...documents];
    t.after(async () => {
        process.exitCode = previousExitCode;
        documents.splice(0, documents.length, ...originalDocuments);
        await rm(directory, { recursive: true, force: true });
    });

    const missing = join(directory, "missing.txt");
    const empty = join(directory, "empty.txt");
    const embedFailure = join(directory, "embed-failure.txt");
    const storeFailure = join(directory, "store-failure.txt");
    const success = join(directory, "success.txt");
    await Promise.all([
        writeFile(empty, " \n"),
        writeFile(embedFailure, "Invalid input"),
        writeFile(storeFailure, "Cannot store"),
        writeFile(success, "Valid document"),
    ]);
    assert.equal(await loadDocuments(success), "Valid document");
    await assert.rejects(loadDocuments(missing), { code: "ENOENT" });

    let authFailure = false;
    let embeddingCalls = 0;
    let writes = 0;
    t.mock.method(globalThis, "fetch", async (url: string, options?: { body: string }) => {
        if (!String(url).includes("api.openai.com")) {
            return Response.json({ version: "1.20.0" });
        }
        embeddingCalls++;
        const { input } = JSON.parse(options?.body ?? "{}");
        if (authFailure) {
            return Response.json({ error: { message: "Invalid key indexing-test-openai-key" } }, { status: 401 });
        }
        if (input[0] === "Invalid input") {
            return Response.json({ error: { message: "Invalid input" } }, { status: 400 });
        }
        return Response.json({ data: [{ embedding: Array(config.openai.embeddingDimensions).fill(1) }] });
    });
    t.mock.method(QdrantClient.prototype, "collectionExists", async () => ({ exists: true }));
    t.mock.method(QdrantClient.prototype, "retrieve", async () => []);
    t.mock.method(QdrantClient.prototype, "upsert", async () => {
        if (++writes === 1) {
            throw new Error("Qdrant write timed out");
        }
    });

    const lines: string[] = [];
    for (const method of ["error", "warn", "log"] as const) {
        t.mock.method(console, method, (message: string) => lines.push(message));
    }

    documents.splice(0, documents.length, missing, empty, embedFailure, storeFailure, success);
    await import("./index.ts");
    assert.equal(process.exitCode, 1);
    assert.equal(embeddingCalls, 3);
    assert.equal(writes, 2);
    assert.match(lines.join("\n"), /\[load\].*missing\.txt.*ENOENT/);
    assert.match(lines.join("\n"), /\[chunk\].*empty\.txt.*contains no text/);
    assert.match(lines.join("\n"), /\[embed\].*embed-failure\.txt.*Invalid input/);
    assert.match(lines.join("\n"), /\[store\].*store-failure\.txt.*timed out/);
    assert.ok(lines.includes("Indexing summary: 1 indexed, 1 skipped, 3 failed, 0 not processed."));

    authFailure = true;
    lines.length = 0;
    documents.splice(0, documents.length, success, storeFailure);
    const rerun = new URL("./index.ts?auth-test", import.meta.url);
    await import(rerun.href);
    assert.equal(embeddingCalls, 4);
    assert.equal(writes, 2);
    assert.match(lines.join("\n"), /Invalid key \[redacted\]/);
    assert.ok(lines.includes("Indexing summary: 0 indexed, 0 skipped, 1 failed, 1 not processed."));
});
