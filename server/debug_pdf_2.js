const pdfLib = require('pdf-parse');
console.log('PDFParse prop type:', typeof pdfLib.PDFParse);
if (typeof pdfLib.PDFParse === 'function') {
    console.log('PDFParse is function/class');
}
// Try to see if it works as a function
const fs = require('fs');
// Create a dummy buffer
const buffer = Buffer.from('dummy');
try {
    pdfLib.PDFParse(buffer).catch(e => console.log('Called PDFParse, caught:', e.message));
} catch (e) {
    console.log('Sync call error:', e.message);
}
