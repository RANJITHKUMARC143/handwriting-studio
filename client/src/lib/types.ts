export const FONTS = [
    'Caveat',
    'Indie Flower',
    'Patrick Hand',
    'Shadows Into Light',
    'Homemade Apple',
    'Gloria Hallelujah',
    'Kalam',
    'Handlee',
    'Architects Daughter',
    'Nothing You Could Do',
];

export interface HandwritingSettings {
    text: string;
    fontFamily: string;
    fontSize: number; // in pt/px
    lineSpacing: number; // multiplier, e.g. 1.5
    letterSpacing: number; // variance
    wordSpacing: number; // variance
    color: string; // hex
    /** @deprecated */
    paperType?: 'plain' | 'lined' | 'grid';
    paperPattern: 'plain' | 'lined' | 'grid';
    paperColor: 'white' | 'warm' | 'vintage';
    margins: { top: number; right: number; bottom: number; left: number };
    randomization: {
        baselineJitter: number; // max vertical offset
        sizeJitter: number; // max size variance
        rotationJitter: number; // max rotation in degrees
        inkOpacity: number; // 0-1, how much it varies
        errorRate: number; // probability of a "mistake" (0-0.05)
        strokeWidth: number; // max stroke width variance
    };
}

export interface RenderResult {
    totalPages: number;
}

export const CANVAS_WIDTH = 595; // A4 Width at 72 DPI (approx)
export const CANVAS_HEIGHT = 842; // A4 Height
