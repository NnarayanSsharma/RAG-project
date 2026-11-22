import { config } from "../config.ts";

export function chunkDocuments(text: string): string[] {
    let paragraphs = text
        .trim()
        .split(config.paragraphSeparator)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0);
    return paragraphs;
}
