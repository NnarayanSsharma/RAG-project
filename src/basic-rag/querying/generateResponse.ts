
import OpenAI from "openai";
import { config } from "../config.ts";

const client = new OpenAI({
    apiKey: config.openai.apiKey,
});



async function generateResponse(query: string, context: string): Promise<string> {
    // Simulate a call to a language model API
    const response = await client.responses.create({
        model: config.openai.responseModel,
        instructions: config.openai.instructions,
        input: `Question: ${query} Context: ${context}`,
    });
    return response.output_text || config.openai.fallbackAnswer;
}

export { generateResponse };
