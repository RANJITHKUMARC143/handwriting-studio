const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FONTS = [
    { name: 'Caveat', url: 'https://raw.githubusercontent.com/googlefonts/caveat/main/Caveat-Regular.ttf', file: 'Caveat-Regular.ttf' },
    { name: 'Indie Flower', id: 'indieflower', file: 'IndieFlower-Regular.ttf' },
    { name: 'Patrick Hand', id: 'patrickhand', file: 'PatrickHand-Regular.ttf' },
    { name: 'Shadows Into Light', id: 'shadowsintolight', file: 'ShadowsIntoLight.ttf' }, // No -Regular
    { name: 'Homemade Apple', id: 'homemadeapple', file: 'HomemadeApple-Regular.ttf' },
    { name: 'Gloria Hallelujah', id: 'gloriahallelujah', file: 'GloriaHallelujah.ttf' }, // No -Regular
    { name: 'Kalam', id: 'kalam', file: 'Kalam-Regular.ttf' },
    { name: 'Handlee', id: 'handlee', file: 'Handlee-Regular.ttf' },
    { name: 'Architects Daughter', id: 'architectsdaughter', file: 'ArchitectsDaughter-Regular.ttf' },
    { name: 'Nothing You Could Do', id: 'nothingyoucoulddo', file: 'NothingYouCouldDo.ttf' }, // No -Regular
];

const DEST = path.join(__dirname, 'assets', 'fonts');

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

FONTS.forEach(font => {
    // Use explicit URL or fallback to standard google/fonts structure
    const url = font.url || `https://raw.githubusercontent.com/google/fonts/main/ofl/${font.id}/${font.file}`;
    const filePath = path.join(DEST, font.file);

    console.log(`Downloading ${font.name} from ${url}...`);
    try {
        execSync(`curl -L -f -o "${filePath}" "${url}"`);

        // Verify it's a TTF (check magic header or size > 20kb)
        const stats = fs.statSync(filePath);
        if (stats.size < 10000) {
            throw new Error('File too small, likely failed download');
        }

        // Simple header check
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);

        // TTF often starts with 0x00010000 or OTTO
        // Just ensuring it's not "<!DO" (HTML)
        if (buffer.toString().startsWith('<')) {
            throw new Error('File appears to be HTML');
        }

    } catch (e) {
        console.error(`FAILED to download ${font.name}: ${e.message}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});
