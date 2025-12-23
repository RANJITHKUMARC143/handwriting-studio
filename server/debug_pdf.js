const pdfParse = require('pdf-parse');
console.log('Type of pdfParse:', typeof pdfParse);
console.log('pdfParse keys:', Object.keys(pdfParse));
try {
    console.log('Is instance of Function?', pdfParse instanceof Function);
} catch (e) { }
