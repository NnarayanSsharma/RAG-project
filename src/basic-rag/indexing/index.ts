import { chunkDocuments } from "./chunkDocuments.ts";
import { config } from "../config.ts";
import { createEmbeddings } from "../common/createEmbeddings.ts";
import { loadDocuments } from "./loadDocument.ts";
import { storeEmbeddings } from "./storeEmbeddings.ts";

for (const filePath of config.documents) {
    await indexDocuments(filePath);
}

async function indexDocuments(filePath: string) {
    const data = await loadDocuments(filePath);

    const chunks = chunkDocuments(data);


    const embeddings = await createEmbeddings(chunks);

    await storeEmbeddings(filePath, chunks, embeddings);
}
