export function buildContext(chunks: any[]): any {
    return chunks.map((chunk, index) => {
        const { text, filePath, paragraphIndex } = chunk.payload || {};
        return `File: ${filePath} - paragraph ${paragraphIndex} - ${text}`;
    }).join("\n\n");
}
