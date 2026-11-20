import { chunkDocuments } from "./chunkDocuments.ts";
import { createEmbeddings } from "./createEmbeddings.ts";
import { loadDocuments } from "./loadDocument.ts";
import { storeEmbeddings } from "./storeEmbeddings.ts";

const filePath = "./src/docs/sam.txt";

const sam = await loadDocuments(filePath);
const chunks = chunkDocuments(sam);


const embeddings = await createEmbeddings(chunks);

await storeEmbeddings(filePath, chunks, embeddings);
