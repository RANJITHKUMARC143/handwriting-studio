# Text-to-Handwriting Server

Backend API for the text-to-handwriting application with PostgreSQL database storage.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (for job queue)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Using psql
createdb handwriting

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE handwriting;
```

### 3. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://localhost:5432/handwriting
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
```

### 4. Initialize Database

The database tables will be created automatically when you start the server for the first time.

### 5. Start Redis

```bash
# macOS (using Homebrew)
brew services start redis

# Or run Redis manually
redis-server
```

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Database Schema

The application uses the following tables:

### `texts` Table
Stores uploaded text content.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content | TEXT | The text content |
| created_at | TIMESTAMP | Creation timestamp |
| expires_at | TIMESTAMP | Expiration timestamp (7 days) |

### `jobs` Table
Stores PDF generation job information.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key (job ID) |
| text_id | UUID | Foreign key to texts table |
| status | VARCHAR(20) | Job status (waiting, active, completed, failed) |
| settings | JSONB | Handwriting settings |
| pdf_path | TEXT | Path to generated PDF |
| progress | INTEGER | Progress percentage (0-100) |
| created_at | TIMESTAMP | Creation timestamp |
| completed_at | TIMESTAMP | Completion timestamp |

## API Endpoints

### Upload File
```
POST /api/upload
Content-Type: multipart/form-data

Body: file (PDF, DOCX, or TXT)

Response:
{
  "textId": "uuid",
  "preview": "text preview...",
  "totalLength": 1234,
  "success": true
}
```

### Generate PDF
```
POST /api/generate
Content-Type: application/json

Body:
{
  "textId": "uuid",
  "settings": { ... handwriting settings ... }
}

Response:
{
  "jobId": "job-id"
}
```

### Check Job Status
```
GET /api/jobs/:id

Response:
{
  "id": "job-id",
  "state": "completed",
  "progress": 100,
  "result": { "filename": "output.pdf" }
}
```

### Download PDF
```
GET /api/jobs/:id/download

Response: PDF file download
```

## Production Deployment

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_HOST=your-redis-host
REDIS_PORT=6379
PORT=3001
NODE_ENV=production
```

### Recommended Platforms

1. **Railway** (Easiest)
   - Automatic PostgreSQL provisioning
   - Built-in Redis support
   - One-click deployment

2. **Render**
   - Free tier available
   - PostgreSQL included
   - Auto-scaling

3. **AWS**
   - RDS for PostgreSQL
   - ElastiCache for Redis
   - EC2 or ECS for server

### Database Migrations

The application automatically creates tables on startup. For production, consider using a migration tool like:
- Prisma
- TypeORM
- node-pg-migrate

## File Storage

Currently, generated PDFs are stored locally in the `output/` directory. For production:

1. **Use Cloud Storage** (Recommended)
   - AWS S3
   - Google Cloud Storage
   - Cloudinary

2. **Update the worker processor** to upload PDFs to cloud storage instead of local filesystem

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep handwriting
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## License

MIT
