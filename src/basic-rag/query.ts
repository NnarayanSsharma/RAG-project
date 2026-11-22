import { buildContext } from "./buildContext.ts";
import { createEmbeddings } from "./createEmbeddings.ts";
import { generateResponse } from "./generateResponse.ts";
import { retrieveChunks } from "./retrieveChunks.ts";

const query = "when and where was Sam Altman born?";

const [queryEmbedding] = await createEmbeddings([query]);

const relevantChunks = await retrieveChunks(queryEmbedding);

let context = buildContext(relevantChunks);
// console.log("Context: ", context);

const response = await generateResponse(query, context);

console.log("RESPONSE: ", response);