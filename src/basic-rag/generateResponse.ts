
import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
});



async function generateResponse(query: string, context: string): Promise<string> {
    // Simulate a call to a language model API
    const response = await client.responses.create({
        model: "gpt-6-luna",
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
        input: `Question: ${query} Context: ${context}`,
    });
    console.log("response: ", response);
    return response.output_text || "I don't know.";
}

export { generateResponse };
