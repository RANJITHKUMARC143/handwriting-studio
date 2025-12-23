const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FONTS = [
    { name: 'Caveat', url: 'https://github.com/google/fonts/raw/main/ofl/caveat/Caveat-Regular.ttf' },
    { name: 'Indie Flower', url: 'https://github.com/google/fonts/raw/main/ofl/indieflower/IndieFlower-Regular.ttf' },
    { name: 'Patrick Hand', url: 'https://github.com/google/fonts/raw/main/ofl/patrickhand/PatrickHand-Regular.ttf' },
    { name: 'Shadows Into Light', url: 'https://github.com/google/fonts/raw/main/ofl/shadowsintolight/ShadowsIntoLight-Regular.ttf' },
    { name: 'Homemade Apple', url: 'https://github.com/google/fonts/raw/main/ofl/homemadeapple/HomemadeApple-Regular.ttf' },
    { name: 'Gloria Hallelujah', url: 'https://github.com/google/fonts/raw/main/ofl/gloriahallelujah/GloriaHallelujah-Regular.ttf' },
    { name: 'Kalam', url: 'https://github.com/google/fonts/raw/main/ofl/kalam/Kalam-Regular.ttf' },
    { name: 'Handlee', url: 'https://github.com/google/fonts/raw/main/ofl/handlee/Handlee-Regular.ttf' },
    { name: 'Architects Daughter', url: 'https://github.com/google/fonts/raw/main/ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf' },
    { name: 'Nothing You Could Do', url: 'https://github.com/google/fonts/raw/main/ofl/nothingyoucoulddo/NothingYouCouldDo-Regular.ttf' },
];

const DEST = path.join(__dirname, 'assets', 'fonts');

// Using curl via execSync because it's robust
FONTS.forEach(font => {
    const filename = font.name.replace(/\s+/g, '') + '-Regular.ttf';
    const filePath = path.join(DEST, filename);
    console.log(`Downloading ${font.name}...`);
    try {
        execSync(`curl -L -o "${filePath}" "${font.url}"`);
    } catch (e) {
        console.error(`Failed to download ${font.name}`);
    }
});
