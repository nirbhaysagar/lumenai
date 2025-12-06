import mammoth from 'mammoth';
// @ts-ignore
import WordExtractor from 'word-extractor';

export async function extractFromDocument(fileBuffer: Buffer, fileExtension: string): Promise<{ text: string }> {
    try {
        // Check for legacy .doc magic bytes (D0 CF 11 E0)
        const isLegacyDoc = fileBuffer.length >= 4 && fileBuffer[0] === 0xD0 && fileBuffer[1] === 0xCF && fileBuffer[2] === 0x11 && fileBuffer[3] === 0xE0;

        if (fileExtension === 'doc' || isLegacyDoc) {
            console.log('Detected legacy .doc file, using word-extractor...');
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(fileBuffer);
            const text = extracted.getBody();
            return { text };
        } else if (fileExtension === 'docx') {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });

            if (result.messages && result.messages.length > 0) {
                console.log('Mammoth messages:', result.messages);
            }

            return { text: result.value };
        } else if (fileExtension === 'txt' || fileExtension === 'md') {
            // Simple text decoding
            return { text: fileBuffer.toString('utf-8') };
        } else {
            throw new Error(`Unsupported document type: ${fileExtension}. Only .docx, .doc, .txt, and .md are supported.`);
        }
    } catch (error: any) {
        console.error('Document extraction error:', error);
        // Preserve the specific error message if we threw it
        if (error.message.includes('Unsupported document type')) {
            throw error;
        }
        throw new Error(`Failed to extract text from document: ${error.message}`);
    }
}
