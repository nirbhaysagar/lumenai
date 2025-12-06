import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export type ChunkStrategy = 'small' | 'balanced' | 'big';

export async function chunkText(text: string, strategy: ChunkStrategy = 'balanced'): Promise<string[]> {
    let chunkSize = 1000;
    let chunkOverlap = 100;

    switch (strategy) {
        case 'small':
            chunkSize = 500; // ~125 tokens
            chunkOverlap = 50;
            break;
        case 'big':
            chunkSize = 2000; // ~500 tokens
            chunkOverlap = 200;
            break;
        case 'balanced':
        default:
            chunkSize = 1000; // ~250 tokens
            chunkOverlap = 100;
            break;
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    const output = await splitter.createDocuments([text]);
    return output
        .map((doc) => doc.pageContent)
        .filter((content) => content.trim().length > 0); // Ensure no empty chunks
}
