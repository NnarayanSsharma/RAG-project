import { readFile } from "node:fs/promises";
import { config } from "../config.ts";

async function loadDocuments(filePath: string): Promise<string> {
  return readFile(filePath, config.documentEncoding);
}

export { loadDocuments };
