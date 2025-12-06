import { extractFromImage } from '../src/lib/extractors/imageExtractor';
import fs from 'fs';
import path from 'path';

async function debug() {
    try {
        console.log('Starting Debug Image Extractor...');

        // Create a minimal valid PNG buffer (1x1 pixel) to test the worker initialization
        // This is a 1x1 transparent PNG
        const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const buffer = Buffer.from(base64Png, 'base64');

        console.log('Buffer created, calling extractFromImage...');
        const start = Date.now();
        const result = await extractFromImage(buffer);
        const end = Date.now();

        console.log('Extraction complete!');
        console.log('Time taken:', (end - start) / 1000, 'seconds');
        console.log('Result text:', result.text);
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debug();
