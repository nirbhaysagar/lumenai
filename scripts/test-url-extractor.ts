import { extractFromUrl } from '../src/lib/extractors/urlExtractor';

async function test() {
    const url = 'https://en.wikipedia.org/wiki/David_Fincher';
    console.log(`Testing extraction for: ${url}`);
    try {
        const result = await extractFromUrl(url);
        console.log('Success!');
        console.log('Title:', result.title);
        console.log('Content length:', result.content.length);
        console.log('Preview:', result.content.substring(0, 100));
    } catch (error) {
        console.error('Extraction failed:', error);
    }
}

test();
