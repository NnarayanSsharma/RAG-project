export function chunkDocuments(text: string): string[] {
    let paragraphs = text
        .trim()
        .split("\n\n")
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0);
    return paragraphs;
}
