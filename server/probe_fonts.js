const { execSync } = require('child_process');

const BASES = [
    'https://raw.githubusercontent.com/google/fonts/main/ofl',
    'https://github.com/google/fonts/raw/main/ofl'
];

const FONTS_TO_CHECK = [
    { id: 'caveat', variants: ['Caveat-Regular.ttf', 'static/Caveat-Regular.ttf', 'Caveat[wght].ttf'] },
    { id: 'shadowsintolight', variants: ['ShadowsIntoLight-Regular.ttf', 'ShadowsIntoLight.ttf'] },
    { id: 'homemadeapple', variants: ['HomemadeApple-Regular.ttf', 'HomemadeApple.ttf'] },
    { id: 'gloriahallelujah', variants: ['GloriaHallelujah-Regular.ttf', 'GloriaHallelujah.ttf'] },
    { id: 'nothingyoucoulddo', variants: ['NothingYouCouldDo-Regular.ttf', 'NothingYouCouldDo.ttf'] },
];

FONTS_TO_CHECK.forEach(font => {
    let found = false;
    for (const base of BASES) {
        if (found) break;
        for (const variant of font.variants) {
            const url = `${base}/${font.id}/${variant}`;
            try {
                // Head request
                execSync(`curl -I -f "${url}"`, { stdio: 'ignore' });
                console.log(`FOUND: ${font.id} -> ${url}`);
                found = true;
                break;
            } catch (e) {
                // ignore
            }
        }
    }
    if (!found) console.log(`FAILED to find ${font.id}`);
});
