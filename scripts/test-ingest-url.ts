import { DEMO_USER_ID } from '../src/lib/constants';

async function testIngest() {
    const url = 'https://en.wikipedia.org/wiki/David_Fincher';
    const formData = new FormData();
    formData.append('userId', DEMO_USER_ID);
    formData.append('type', 'url');
    formData.append('url', url);

    console.log('Attempt 1...');
    try {
        const res1 = await fetch('http://localhost:3000/api/ingest', {
            method: 'POST',
            body: formData,
        });
        const data1 = await res1.json();
        console.log('Response 1:', res1.status, data1);
    } catch (e) {
        console.error('Error 1:', e);
    }

    console.log('Attempt 2...');
    try {
        const res2 = await fetch('http://localhost:3000/api/ingest', {
            method: 'POST',
            body: formData,
        });
        const data2 = await res2.json();
        console.log('Response 2:', res2.status, data2);
    } catch (e) {
        console.error('Error 2:', e);
    }
}

testIngest();
