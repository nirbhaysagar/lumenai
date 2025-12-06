import { DEMO_USER_ID } from '../src/lib/constants';
import fs from 'fs';
import path from 'path';

async function testDocxIngest() {
    console.log('--- Testing DOCX Ingestion ---');
    const docPath = path.resolve('node_modules/mammoth/test/test-data/single-paragraph.docx');

    if (fs.existsSync(docPath)) {
        const docBuffer = fs.readFileSync(docPath);
        const docBlob = new Blob([docBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        const formData = new FormData();
        formData.append('userId', DEMO_USER_ID);
        formData.append('type', 'document');
        formData.append('file', docBlob, 'test.docx');

        try {
            const res = await fetch('http://localhost:3000/api/ingest', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            console.log('DOCX Response:', res.status, data);
        } catch (e) {
            console.error('DOCX Error:', e);
        }
    } else {
        console.warn('Sample DOCX not found at', docPath);
    }
}

testDocxIngest();
