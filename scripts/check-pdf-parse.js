const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Keys:', Object.keys(pdf));
console.log('Is PDFParse a function?', typeof pdf.PDFParse);
if (typeof pdf.PDFParse === 'function') {
    console.log('PDFParse prototype:', pdf.PDFParse.prototype);
}
