import { readFile } from "node:fs/promises";

async function loadDocuments(filePath: string): Promise<string> {
  try {
    const data = await readFile(filePath, "utf-8");
    return data;
  } catch (error) {
    console.error(`Error loading document from ${filePath}:`, error);
    throw error;
  }
}

export { loadDocuments };