import { QdrantClient } from "@qdrant/js-client-rest";
import * as dotenv from "dotenv";
dotenv.config();

export const client = new QdrantClient({
  url: process.env.QDRANT_HOST,
  apiKey: process.env.QDRANT_API_KEY,
});

// generate query embedding
const queryText = "fish dishes";

// search for similar items
const results = await client.query("items", {
  query: {
    text: queryText,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  },
  with_payload: true,
  limit: 5,
});

// print results
console.log("results: ", results.points, "results length: ", results.points.length);
for (const result of results.points) {
  console.log(`Item: ${result.payload?.item_name || 'N/A'}`);
  console.log(`Score: ${result.score}`);
  console.log(`Description: ${result.payload?.description || 'N/A'}`);
  console.log(`Price: ${result.payload?.price || 'N/A'}`);
  console.log('---');
}