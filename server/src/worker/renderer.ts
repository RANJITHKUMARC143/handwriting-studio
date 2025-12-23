import { registerFont, createCanvas, CanvasRenderingContext2D } from 'canvas';
import path from 'path';

// Define Interface (shared-ish)
interface HandwritingSettings {
    text: string;
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
    letterSpacing: number;
    wordSpacing: number;
    color: string;
    paperType?: 'plain' | 'lined' | 'grid';
    paperPattern: 'plain' | 'lined' | 'grid';
    paperColor: 'white' | 'warm' | 'vintage';
    margins: { top: number; right: number; bottom: number; left: number };
    randomization: {
        baselineJitter: number;
        sizeJitter: number;
        rotationJitter: number;
        inkOpacity: number;
        errorRate: number;
        strokeWidth: number;
    };
}

// Register Font
const FONTS = [
    { name: 'Caveat', file: 'Caveat-Regular.ttf' },
    { name: 'Indie Flower', file: 'IndieFlower-Regular.ttf' },
    { name: 'Patrick Hand', file: 'PatrickHand-Regular.ttf' },
    { name: 'Shadows Into Light', file: 'ShadowsIntoLight.ttf' },
    { name: 'Homemade Apple', file: 'HomemadeApple-Regular.woff' },
    { name: 'Gloria Hallelujah', file: 'GloriaHallelujah.ttf' },
    { name: 'Kalam', file: 'Kalam-Regular.ttf' },
    { name: 'Handlee', file: 'Handlee-Regular.ttf' },
    { name: 'Architects Daughter', file: 'ArchitectsDaughter-Regular.ttf' },
    { name: 'Nothing You Could Do', file: 'NothingYouCouldDo.ttf' },
];

FONTS.forEach(font => {
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', font.file);
    try {
        registerFont(fontPath, { family: font.name });
    } catch (e) {
        console.warn(`Could not register font ${font.name}`, e);
    }
});

const random = () => Math.random();

export async function renderPageToBuffer(
    text: string,
    settings: HandwritingSettings
): Promise<{ buffer: Buffer; remainingText: string }> { // Changed return type
    // Reduced from 300 DPI (2480x3508) to 150 DPI to prevent OOM on large docs
    const width = 1240;
    const height = 1754;

    // Scale settings from screen to print
    // Frontend is approx 595 width (72 DPI), so scale factor is approx 2.08
    const scaleFactor = width / 595;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background Colors
    const paperColors = {
        white: '#ffffff',
        warm: '#f9f5eb',
        vintage: '#f0e6d2'
    };
    // @ts-ignore
    ctx.fillStyle = paperColors[settings.paperColor] || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw Paper Pattern
    if (settings.paperPattern !== 'plain') {
        ctx.strokeStyle = settings.paperColor === 'vintage' ? '#d1c7b0' : '#e0e0e0';
        if (settings.paperPattern === 'grid') ctx.strokeStyle = '#d0d0d0';

        ctx.lineWidth = 2; // Thicker for high-res
        const lineHeight = settings.fontSize * settings.lineSpacing * scaleFactor;

        // Horizontal Lines (Lined only, or we do grid separately)
        if (settings.paperPattern === 'lined') {
            const marginTop = settings.margins.top * scaleFactor;
            const marginBottom = settings.margins.bottom * scaleFactor;
            for (let y = marginTop + lineHeight; y < height - marginBottom; y += lineHeight) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
        }

        // Grid (Full Page)
        if (settings.paperPattern === 'grid') {
            const gridSize = settings.fontSize * settings.lineSpacing * scaleFactor;
            ctx.beginPath();
            // Vertical
            for (let x = 0; x <= width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            // Horizontal
            for (let y = 0; y <= height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();
        }
    }

    ctx.fillStyle = settings.color;
    const fontSizePx = settings.fontSize * scaleFactor;
    ctx.font = `${fontSizePx}px "${settings.fontFamily}"`;
    ctx.textBaseline = 'alphabetic';

    const margins = {
        top: settings.margins.top * scaleFactor,
        left: settings.margins.left * scaleFactor,
        right: settings.margins.right * scaleFactor,
        bottom: settings.margins.bottom * scaleFactor,
    };

    const lineHeight = fontSizePx * settings.lineSpacing;
    const lines = text.split('\n');

    let cursorX = margins.left;
    let cursorY = margins.top + fontSizePx;

    let remainingText = '';
    let isOverflow = false;

    // Iterate lines
    for (let i = 0; i < lines.length; i++) {
        // Replace tabs with 4 spaces to ensure they render with width
        const line = lines[i].replace(/\t/g, '    ');

        // Split by whitespace but KEEPS the whitespace as tokens
        // logic: split by space, but we want to know IF it was a space.
        // Actually simpler: split by regex capturing group to keep delimiters
        const segments = line.split(/(\s+)/);

        // Iterate segments (words and whitespace groups)
        for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];
            if (!segment) continue;

            const isWhitespace = /^\s+$/.test(segment);

            if (isWhitespace) {
                // Just advance cursor, don't draw
                // We add some randomization to space width too for realism
                const baseWidth = ctx.measureText(segment).width;
                const jitter = (random() - 0.5) * (settings.wordSpacing * segment.length * scaleFactor);
                cursorX += baseWidth + jitter;
                continue;
            }

            // Valid word
            const word = segment;
            const measure = ctx.measureText(word);
            const wordWidth = measure.width;

            // Wrap?
            if (cursorX + wordWidth > width - margins.right) {
                cursorX = margins.left;
                cursorY += lineHeight;

                // Check overflow
                if (cursorY > height - margins.bottom) {
                    isOverflow = true;
                    // Reconstruct remainder
                    // Current word + rest of line
                    const restOfLine = segments.slice(j).join('');
                    // Rest of lines
                    const restOfText = lines.slice(i + 1).join('\n');
                    remainingText = restOfLine + (restOfText ? '\n' + restOfText : '');
                    break;
                }
            }

            // SIMULATE ERROR: Chance to write a wrong word, then cross it out
            if (random() < (settings.randomization?.errorRate || 0)) {
                // Generate a "wrong" word (e.g. slight typo or just random chars)
                const wrongWord = generateWrongWord(word);
                const wrongMeasure = ctx.measureText(wrongWord);
                const wrongWidth = wrongMeasure.width;

                // Only if it likely fits to avoid messy wraps on errors
                if (cursorX + wrongWidth < width - margins.right) {
                    // Draw Wrong Word
                    for (const char of wrongWord) {
                        drawCharacter(ctx, char, cursorX, cursorY, settings, scaleFactor); // Draw text
                        cursorX += ctx.measureText(char).width + (random() - 0.5) * scaleFactor;
                    }

                    // Scratch it out
                    ctx.beginPath();
                    ctx.strokeStyle = settings.color;
                    ctx.lineWidth = 1.5 * scaleFactor;
                    // Canvas doesn't support globalAlpha for stroke separately easily, but we can manage context state
                    ctx.globalAlpha = 0.9;
                    const scratchStart = cursorX - wrongWidth - (5 * scaleFactor);
                    const scratchEnd = cursorX + (5 * scaleFactor);
                    const scratchY = cursorY - fontSizePx * 0.3;

                    // Messy scratch
                    ctx.moveTo(scratchStart, scratchY + (random() - 0.5) * 5 * scaleFactor);
                    for (let k = scratchStart; k < scratchEnd; k += (10 * scaleFactor)) {
                        ctx.lineTo(k, scratchY + (random() - 0.5) * 10 * scaleFactor);
                    }
                    ctx.stroke();
                    ctx.globalAlpha = 1; // Reset alpha

                    // Space after scratch
                    cursorX += 15 * scaleFactor;

                    // Check wrap again for real word
                    if (cursorX + wordWidth > width - margins.right) {
                        cursorX = margins.left;
                        cursorY += lineHeight;
                        if (cursorY > height - margins.bottom) {
                            isOverflow = true;
                            remainingText = lines.slice(i).join('\n'); // Crude fallback for overflow during error
                            break;
                        }
                    }
                }
            }

            // Draw Chars
            for (const char of word) {
                drawCharacter(ctx, char, cursorX, cursorY, settings, scaleFactor);
                const charWidth = ctx.measureText(char).width;
                // Letter spacing
                const spacing = charWidth + (random() - 0.5) * (settings.letterSpacing * scaleFactor);
                cursorX += spacing;
            }
        }

        if (isOverflow) break;

        // Newline
        cursorX = margins.left;
        cursorY += lineHeight;

        if (cursorY > height - margins.bottom && i < lines.length - 1) {
            isOverflow = true;
            remainingText = lines.slice(i + 1).join('\n');
            break;
        }
    }

    return { buffer: canvas.toBuffer('image/png'), remainingText };
}

function generateWrongWord(correct: string): string {
    // Simple mistake: repeat a char or delete one
    if (correct.length < 3) return correct + 'e'; // simple suffix filler
    // Random typo logic could be fancier
    return correct.split('').reverse().join('').slice(0, Math.ceil(correct.length / 2)); // just gibberish
}

function drawCharacter(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    settings: HandwritingSettings,
    scale: number
) {
    const { randomization } = settings;

    ctx.save();

    const jitterX = (random() - 0.5) * randomization.baselineJitter * scale;
    const jitterY = (random() - 0.5) * randomization.baselineJitter * scale;
    const angle = (random() - 0.5) * (randomization.rotationJitter * Math.PI / 180);
    const sizeScale = 1 + (random() - 0.5) * randomization.sizeJitter;

    // Node-canvas might handle globalAlpha differently if not careful, but usually standard.
    // However, for print, we might want solid colors or realistic transparency.
    ctx.globalAlpha = 1 - Math.random() * randomization.inkOpacity;

    ctx.translate(x + jitterX, y + jitterY);
    ctx.rotate(angle);
    ctx.scale(sizeScale, sizeScale);

    ctx.fillText(char, 0, 0);

    ctx.restore();
}
