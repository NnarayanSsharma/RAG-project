##Basic Project
1. Create our knowledege(some .txt file)
<!-- Indexing phase -->
2. Document loading
3. Chunking
4. Embedding
5. Store the embedding into vector DB
<!-- Query Phase -->
6. create query
7. Embedding
8. Retrieve relevant chunks from vector DB
9. Pass the chunks and query into LLM
10. Generate the final response

Run the basic RAG pipeline from the repository root:

```sh
node src/basic-rag/indexing/index.ts
node src/basic-rag/querying/query.ts
```


<!-- gpt-6-luna -->
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "your-openai-api-key",
});

const response = openai.responses.create({
  model: "gpt-6-luna",
  input: "write a haiku about ai",
  store: true,
});

response.then((result) => console.log(result.output_text));




##QDrant Demo
1. Setup the QDrant Account
2. Create Cluster
3. Setup Project empty repo
4. npm init
5. create .env, and paste apikey and url
6. Git init, and add gitignore file
7. npm install @qdrant/js-client-rest
8. Conect to QDrant Cloud
9. npm install dotenv
10. added:  import * as dotenv from "dotenv";
dotenv.config();
