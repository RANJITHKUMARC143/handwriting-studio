import { HandwritingSettings, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

// Pseudo-random number generator for consistent rendering if needed (optional)
// For now using Math.random, but in production we'd want a seeded RNG for consistent exports.
const random = () => Math.random();

export function renderPage(
    ctx: CanvasRenderingContext2D,
    text: string,
    settings: HandwritingSettings,
    pageIndex: number = 0
) {
    const {
        fontFamily,
        fontSize,
        color,
        margins,
        lineSpacing,
        randomization,
    } = settings;

    // Background Colors
    const paperColors = {
        white: '#ffffff',
        warm: '#f9f5eb',
        vintage: '#f0e6d2',
        'grey-light': '#f5f5f5',
        'grey-medium': '#e8e8e8',
        'grey-dark': '#d3d3d3'
    };
    ctx.fillStyle = paperColors[settings.paperColor] || '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw Paper Pattern
    if (settings.paperPattern !== 'plain') {
        ctx.strokeStyle = settings.paperColor === 'vintage' ? '#d1c7b0' : '#e0e0e0';
        if (settings.paperPattern === 'grid') ctx.strokeStyle = '#d0d0d0';

        ctx.lineWidth = 1;
        const lineHeight = fontSize * lineSpacing;

        // Horizontal Lines (for both Lined and Grid)
        for (let y = margins.top + lineHeight; y < ctx.canvas.height - margins.bottom; y += lineHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
        }

        // Vertical Lines (Grid only)
        if (settings.paperPattern === 'grid') {
            const spacing = lineHeight; // Square grid based on line height
            for (let x = margins.left; x < ctx.canvas.width - margins.right; x += spacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0); // Should we grid the whole page or just content area? Usually whole page for graph paper.
                ctx.lineTo(x, ctx.canvas.height);
                ctx.stroke();
            }
            // Actually, for graph paper, it usually covers the whole page, forcing grid to align with margins is nice though.
            // Let's draw grid properly across the whole page starting from a simpler offset or just margin-based.
            // Re-doing grid to be full page:
        }
    }

    if (settings.paperPattern === 'grid') {
        // Clear and redraw for proper full-page grid
        // (Simpler implementation for grid to keep it clean)
        const gridSize = fontSize * lineSpacing;
        ctx.beginPath();
        // Vertical
        for (let x = 0; x <= ctx.canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
        }
        // Horizontal (already drawn above? let's override logic to be cleaner)
        for (let y = 0; y <= ctx.canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
        }
        ctx.stroke();
    }

    // Setup Font
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.textBaseline = 'alphabetic';

    const words = text.split(/\s+/); // crude split, better to keep newlines
    // Wait, we need to handle newlines properly.
    // A better splitter would preserve newlines.

    // Re-split respecting logical newlines
    const lines = text.split('\n');

    let cursorX = margins.left;
    let cursorY = margins.top + fontSize; // Start at first baseline

    // We need to simulate flow across pages, but that's expensive for just one preview page.
    // For this generic renderer, let's assume 'text' passed in is *only the text for this page* 
    // OR we implement a full layout engine.
    // REQUIREMENT: "Generates: Live page preview" and "Splits content into page-sized chunks"
    // So the *Chunking* should happen before rendering or part of layout.

    // Let's implement a 'layout' function that returns pages, and a 'render' function that takes one page.

    // For the preview, we'll just attempt to write the text until it fills the page.

    const lineHeight = fontSize * lineSpacing;

    // Iterate lines
    for (let i = 0; i < lines.length; i++) {
        // Replace tabs with 4 spaces
        const line = lines[i].replace(/\t/g, '    ');

        // Split by whitespace keeping delimiters
        const segments = line.split(/(\s+)/);

        for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];
            if (!segment) continue;

            const isWhitespace = /^\s+$/.test(segment);

            if (isWhitespace) {
                const baseWidth = ctx.measureText(segment).width;
                // Add slight jitter to spacing too for realism, but keep it mostly aligned
                const jitter = (random() - 0.5) * ((settings.wordSpacing || 0) * segment.length);
                cursorX += baseWidth + jitter;
                continue;
            }

            const word = segment;
            const measure = ctx.measureText(word);
            const wordWidth = measure.width;

            // Wrap?
            if (cursorX + wordWidth > ctx.canvas.width - margins.right) {
                cursorX = margins.left;
                cursorY += lineHeight;

                if (cursorY > ctx.canvas.height - margins.bottom) return;
            }

            // SIMULATE ERROR: Chance to write a wrong word, then cross it out
            if (random() < (settings.randomization?.errorRate || 0)) {
                // Generate a "wrong" word (e.g. slight typo or just random chars)
                const wrongWord = generateWrongWord(word);
                const wrongMeasure = ctx.measureText(wrongWord);
                const wrongWidth = wrongMeasure.width;

                // Only if it likely fits to avoid messy wraps on errors
                if (cursorX + wrongWidth < ctx.canvas.width - margins.right) {
                    // Draw Wrong Word
                    for (const char of wrongWord) {
                        drawCharacter(ctx, char, cursorX, cursorY, settings, color); // Draw text
                        cursorX += ctx.measureText(char).width + (random() - 0.5);
                    }

                    // Scratch it out
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = 0.9;
                    const scratchStart = cursorX - wrongWidth - 5;
                    const scratchEnd = cursorX + 5;
                    const scratchY = cursorY - fontSize * 0.3;

                    // Messy scratch
                    ctx.moveTo(scratchStart, scratchY + (random() - 0.5) * 5);
                    for (let k = scratchStart; k < scratchEnd; k += 10) {
                        ctx.lineTo(k, scratchY + (random() - 0.5) * 10);
                    }
                    ctx.stroke();

                    // Space after scratch
                    cursorX += 15;

                    // Check wrap again for real word
                    if (cursorX + wordWidth > ctx.canvas.width - margins.right) {
                        cursorX = margins.left;
                        cursorY += lineHeight;
                        if (cursorY > ctx.canvas.height - margins.bottom) return;
                    }
                }
            }

            // Draw Correct Word
            for (const char of word) {
                drawCharacter(ctx, char, cursorX, cursorY, settings, color);
                const charWidth = ctx.measureText(char).width;
                const spacing = charWidth + (random() - 0.5) * (settings.letterSpacing || 0);
                cursorX += spacing;
            }
        }

        // Explicit Newline
        cursorX = margins.left;
        cursorY += lineHeight;

        if (cursorY > ctx.canvas.height - margins.bottom) return;
    }
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
    baseColor: string
) {
    const { randomization } = settings;

    ctx.save();

    // Jitter Position
    const jitterX = (random() - 0.5) * randomization.baselineJitter; // simplistic use
    const jitterY = (random() - 0.5) * randomization.baselineJitter;

    // Rotation
    const angle = (random() - 0.5) * (randomization.rotationJitter * Math.PI / 180);

    // Scale/Size Jitter
    const scale = 1 + (random() - 0.5) * randomization.sizeJitter;

    // Opacity
    ctx.globalAlpha = Math.min(1, Math.max(0.1, 1 - Math.random() * randomization.inkOpacity));
    ctx.fillStyle = baseColor;

    ctx.translate(x + jitterX, y + jitterY);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.fillText(char, 0, 0);

    ctx.restore();
}
