import { readFile } from "node:fs/promises";
import { config } from "../config.ts";

async function loadDocuments(filePath: string): Promise<string> {
  try {
    const data = await readFile(filePath, config.documentEncoding);
    return data;
  } catch (error) {
    console.error(`Error loading document from ${filePath}:`, error);
    throw error;
  }
}

export { loadDocuments };