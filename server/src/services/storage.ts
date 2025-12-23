import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure dir exists
(async () => {
    try { await fs.mkdir(UPLOAD_DIR, { recursive: true }); } catch { }
})();

export async function saveText(content: string): Promise<string> {
    const id = uuidv4();
    await fs.writeFile(path.join(UPLOAD_DIR, `${id}.txt`), content, 'utf-8');
    return id;
}

export async function getStoredText(id: string): Promise<string | null> {
    try {
        return await fs.readFile(path.join(UPLOAD_DIR, `${id}.txt`), 'utf-8');
    } catch {
        return null;
    }
}
