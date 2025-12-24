const pdfLib = require('pdf-parse');
(async () => {
    try {
        console.log('Testing with Buffer...');
        const buffer = Buffer.from('%PDF-1.0\n');

        try {
            const parser = new pdfLib.PDFParse(buffer);
            await parser.getText();
        } catch (err) {
            console.log('Buffer failed as expected:', err.message);
        }

        console.log('Testing with Uint8Array...');
        const uint8 = new Uint8Array(buffer);
        console.log('Is Uint8Array?', uint8 instanceof Uint8Array);
        console.log('Is Buffer?', Buffer.isBuffer(uint8)); // Should be false if copied, or true if view? 
        // Node Buffer IS Uint8Array, so instanceof is true for both.
        // But if library checks Buffer.isBuffer() and throws...

        try {
            // We need to bypass Buffer check.
            // If we copy it:
            const pureUint8 = new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

            const parser = new pdfLib.PDFParse(pureUint8);
            console.log('Parser created with Uint8Array.');
            const result = await parser.getText();
            console.log('Success! Keys:', Object.keys(result));
        } catch (err) {
            console.log('Uint8Array failed:', err.message);
        }

    } catch (e) {
        console.log('Global error:', e.message);
    }
})();
