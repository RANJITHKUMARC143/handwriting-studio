import { Pool } from 'pg';

// Check if we should use in-memory storage (for local dev without PostgreSQL)
const USE_IN_MEMORY = process.env.USE_IN_MEMORY_STORAGE === 'true';

// Create PostgreSQL connection pool (only if not using in-memory storage)
export const pool = USE_IN_MEMORY ? null : new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/handwriting',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection (only if using database)
if (pool) {
    pool.on('connect', () => {
        console.log('✅ Database connected');
    });

    pool.on('error', (err) => {
        console.error('❌ Unexpected database error:', err);
    });
} else {
    console.log('ℹ️  Using in-memory storage (no database)');
}

// Initialize database tables
export async function initDatabase() {
    // Skip database initialization if using in-memory storage
    if (!pool) {
        console.log('ℹ️  Skipping database initialization (using in-memory storage)');
        return;
    }

    try {
        console.log('Initializing database...');

        // Create texts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS texts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 minutes'
            )
        `);

        // Create jobs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id VARCHAR(255) PRIMARY KEY,
                text_id UUID REFERENCES texts(id) ON DELETE CASCADE,
                status VARCHAR(20) NOT NULL,
                settings JSONB NOT NULL,
                pdf_path TEXT,
                progress INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP
            )
        `);

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_texts_expires 
            ON texts(expires_at)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_status 
            ON jobs(status)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_jobs_created 
            ON jobs(created_at DESC)
        `);

        console.log('✅ Database initialized successfully');

        // Clean up expired texts (optional, can be run periodically)
        await cleanupExpiredTexts();

    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

// Cleanup expired texts
export async function cleanupExpiredTexts() {
    if (!pool) return;

    try {
        const result = await pool.query(`
            DELETE FROM texts 
            WHERE expires_at < NOW()
            RETURNING id
        `);

        if (result.rowCount && result.rowCount > 0) {
            console.log(`🗑️  Cleaned up ${result.rowCount} expired texts`);
        }
    } catch (error) {
        console.error('Error cleaning up expired texts:', error);
    }
}

// Graceful shutdown
export async function closeDatabase() {
    if (!pool) {
        console.log('No database connection to close');
        return;
    }

    await pool.end();
    console.log('Database connection closed');
}
