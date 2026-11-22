import "dotenv/config";

export const config = {
    documents: [
        "./src/docs/sam.txt",
        "./src/docs/dario.txt",
        "./src/docs/elon.txt",
    ],
    documentEncoding: "utf-8",
    paragraphSeparator: /\r?\n(?:[ \t]*\r?\n)+/,
    openai: {
        apiKey: process.env.OPEN_AI_API_KEY,
        embeddingModel: "text-embedding-3-small",
        embeddingEncoding: "float",
        embeddingDimensions: 1536,
        responseModel: "gpt-6-luna",
        fallbackAnswer: "I don't know.",
        instructions: `
            Answer the question concisely using only the supplied context.
            Combine facts from multiple paragraphs when needed.

            End with a "Sources" line listing every paragraph that supports the answer.
            Use the file paths and paragraph numbers from the context. Group references
            by file, remove duplicates, and compress consecutive numbers into ranges.
            Never invent citations or include paragraphs you did not use.

            If the context supports only part of the answer, answer that part and say
            what information is missing. If it supports none of the answer, reply
            "I don't know based on the provided context." and omit the Sources line.

            Example source line:
            Sources: src/docs/sam.txt, paragraphs 2, 4 and 6.
        `,
    },
    qdrant: {
        apiKey: process.env.QDRANT_API_KEY,
        url: process.env.QDRANT_HOST,
        collectionName: "people",
        distance: "Cosine",
        retrievalLimit: 4,
    },
    sampleQuery: "Who built entropic, and who were the co founders?",
} as const;
