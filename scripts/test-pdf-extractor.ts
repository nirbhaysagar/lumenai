
import { extractFromPdf } from '../src/lib/extractors/pdfExtractor';
import fs from 'fs';
import path from 'path';

async function testPdfExtraction() {
    console.log('Testing PDF Extraction...');

    // A valid minimal PDF (Base64 decoded)
    // "Hello World" PDF
    const pdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMta2lkcwo8PAogIC9UeXBlIC9QYWdlcwogIC9NZWRpYUJveCBbIDAgMCAyMDAgMjAwIF0KICAvQ291bnQgMQogIC9LaWRzIFsgMyAwIFIgXQo+PgplbmRvYmoKCjMgMCBvYmogICUgcGFnZQo8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmogICVmb250Cjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iaiAgJSBwYWdlIGNvbnRlbnQKPDwKICAvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAo3MCA1MCBUZAovRjEgMTIgVGYKKHdlbGNvbWUgdG8gcGRmLXBhcnNlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAzMDUgMDAwMDAgbiAKMDAwMDAwMDM5MiAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0ODcKJSVFT0Y=";

    const buffer = Buffer.from(pdfBase64, 'base64');

    try {
        const result = await extractFromPdf(buffer);
        console.log('Extraction Success!');
        console.log('Page Count:', result.pageCount);
        console.log('Content:', result.content);
        console.log('Metadata:', result.metadata);
    } catch (error) {
        console.error('Extraction Failed:', error);
    }
}

testPdfExtraction();
