const pdfLib = require('pdf-parse');
(async () => {
    try {
        console.log('Prototype keys:', Object.getOwnPropertyNames(pdfLib.PDFParse.prototype));
        // Empty buffer might throw, so try valid header if possible, or just catch error
        const buffer = Buffer.from('%PDF-1.0\n');
        const parser = new pdfLib.PDFParse(buffer);
        console.log('Parser created.');
        try {
            const result = await parser.getText();
            console.log('Result keys:', Object.keys(result));
            console.log('Text content type:', typeof result.text);
        } catch (err) {
            console.log('getText error (expected for empty pdf):', err.message);
        }
    } catch (e) {
        console.log('Global error:', e.message);
    }
})();
