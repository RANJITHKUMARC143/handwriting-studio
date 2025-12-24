declare module 'pdf-parse' {
    interface PdfData {
        numpages: number;
        numrender: number;
        info: any;
        metadata: any;
        text: string;
        version: string;
    }

    export class PDFParse {
        constructor(dataBuffer: Buffer | Uint8Array | any);
        getText(): Promise<{ text: string }>;
    }
}
