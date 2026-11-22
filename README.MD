# Basic RAG Pipeline

A TypeScript project for learning retrieval-augmented generation (RAG). It indexes sample biographies in Qdrant, retrieves paragraphs relevant to a question, and uses OpenAI to generate an answer with file and paragraph references.

## Quick Start

Use Node.js 22.20.0 or a compatible newer release that can run the TypeScript files directly. You'll also need OpenAI API access and a Qdrant instance. Run the commands below from the repository root.

1. Install dependencies.

   ```sh
   npm ci
   ```

2. Create a `.env` file in the repository root and fill in your API keys and full Qdrant URL.

   ```dotenv
   OPEN_AI_API_KEY=your-openai-api-key
   QDRANT_HOST=https://your-qdrant-cluster-url
   QDRANT_API_KEY=your-qdrant-api-key
   ```

3. Index the documents, then run a query.

   ```sh
   node src/basic-rag/indexing/index.ts
   node src/basic-rag/querying/query.ts
   ```

Edit `sampleQuery` in [config.ts](src/basic-rag/config.ts) to try another question, such as “When and where was Sam Altman born?” The query script prints the answer to the terminal.

## Repository Structure

```text
src/
├── basic-rag/
│   ├── config.ts              Pipeline settings and prompt
│   ├── common/                Embedding code used by both phases
│   ├── indexing/              Document loading, chunking, and vector storage
│   └── querying/              Retrieval, context building, and answer generation
├── docs/                      Sample biographies used as source documents
└── qdrant-demo/               Standalone menu-item search example
```

- [`src/basic-rag/`](src/basic-rag/) contains the end-to-end RAG pipeline. Its config sets the document list, embedding and response models, collection name, retrieval limit, and sample question.
- [`common/`](src/basic-rag/common/) contains `createEmbeddings.ts`, so indexing and querying use the same embedding model and dimensions.
- [`indexing/`](src/basic-rag/indexing/) contains the indexing entry point and helpers for reading documents, splitting paragraphs, and storing vectors.
- [`querying/`](src/basic-rag/querying/) contains the query entry point and helpers for finding relevant paragraphs, formatting context, and generating a cited answer.
- [`src/docs/`](src/docs/) contains the Sam Altman, Dario Amodei, and Elon Musk sample documents.
- [`src/qdrant-demo/`](src/qdrant-demo/) contains a standalone semantic search example for restaurant menu items. It uses the separate `items` collection.

## Step 1 — Indexing Phase

1. `index.ts` reads the document list from `config.ts` and loads each text file through `loadDocument.ts`.
2. `chunkDocuments.ts` splits the text at blank lines and discards empty chunks.
3. `createEmbeddings.ts` embeds the paragraphs with `text-embedding-3-small`.
4. `storeEmbeddings.ts` creates the `people` collection if needed and writes missing points. Each point stores a vector, the paragraph text, its source file path, and its original paragraph number.

Point IDs are stable for a given file path and paragraph position. Rerunning indexing still requests embeddings for the configured documents. It inserts missing points and skips existing IDs, so editing a paragraph in place can leave the previously indexed text in Qdrant.

## Step 2 — Querying Phase

1. `query.ts` embeds the configured question with the same model used during indexing.
2. `retrieveChunks.ts` searches the `people` collection and retrieves up to four matching paragraphs by default.
3. `buildContext.ts` labels each retrieved paragraph with its source file and original paragraph number.
4. `generateResponse.ts` sends the question and context to the configured response model. The prompt asks for an answer grounded in the context and a concise source line. When the context contains no relevant information, it asks the model to say so.

For example, a response supported by three nonconsecutive paragraphs might end with `Sources: ./src/docs/sam.txt, paragraphs 2, 4 and 6.`
