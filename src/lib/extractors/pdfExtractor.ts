export async function extractFromPdf(buffer: Buffer) {
    try {
        // Import directly to bypass index.js test file check which crashes in Next.js
        const pdf = require('pdf-parse/lib/pdf-parse.js');
        const data = await pdf(buffer);

        // Basic cleaning of the text
        const content = data.text
            .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
            .trim();

        return {
            content,
            pageCount: data.numpages,
            metadata: {
                info: data.info,
                metadata: data.metadata,
                version: data.version,
            }
        };
    } catch (error: any) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}
