# Audio Annotation Tool

Medical audio annotation tool for German clinical speech-to-text. Doctors dictate operation reports; a speech model produces a first-pass transcript. Annotators correct and enrich these transcripts to create a gold standard for model evaluation and fine-tuning.

## Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Runtime     | Node 22                                   |
| Language    | TypeScript 6 (strict mode, ES modules)    |
| Backend     | Express 5                                 |
| ORM         | Prisma 6                                  |
| Database    | PostgreSQL 16 (via Docker Compose)        |
| Frontend    | Vue 3 (Composition API, `<script setup>`) |
| Styling     | Tailwind CSS v4                           |
| Audio       | WaveSurfer.js 7                           |
| Build       | Vite 8                                    |
| Package Mgr | Yarn 4.12.0                               |

## Quick Start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (with Docker Compose v2)

### Steps

```bash
# Clone the repository
git clone <repository-url>
cd audio-annotation-tool

# Start all services (PostgreSQL, Backend, Frontend)
docker compose up --build
```

First startup takes a few minutes (installing dependencies, generating Prisma client, running migrations). Subsequent starts are much faster.

### Access

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Database    | localhost:5432        |

### Testing with Sample Data

1. Place your audio files (`.wav`, `.mp3`, or `.m4a`) in `sample-data/audio/`
2. Create a `sample-data/transcripts.json` file with transcript entries:
   ```json
   [
     { "path": "audio/file1.wav", "label": "Transcript text for file 1..." },
     { "path": "audio/file2.wav", "label": "Transcript text for file 2..." }
   ]
   ```
3. Open http://localhost:5173
4. Click **Upload** in the top bar
5. Select audio files from `sample-data/audio/`
6. Select `sample-data/transcripts.json`
7. Click **Upload**

### Stopping

```bash
# Stop all services
docker compose down

# Stop and remove database volumes (fresh start)
docker compose down -v
```

## Architecture

```
sample-data/          # Sample audio files and transcripts for testing
backend/
  src/
    routes/           # Express route definitions
    controllers/      # Request handlers
    services/         # Business logic
    repositories/     # Database queries (Prisma)
    middleware/       # Express middleware
    lib/prisma.ts     # Prisma client singleton
    config.ts         # Environment config
    app.ts            # Express app setup
    index.ts          # Server entry point
  prisma/
    schema.prisma     # Data model (AudioItem, Transcript, Annotation)
  uploads/            # Stored audio files (gitignored)
frontend/
  src/
    components/       # Reusable UI components
    composables/      # State management and utilities
    layouts/          # Page layouts
    services/         # API client
    types/            # Shared TypeScript types
  vite.config.ts      # Vite config with dev proxy
```

## Data Model

- **AudioItem** — uploaded audio file with metadata (filename, duration, status)
- **Transcript** — original and corrected text for an audio item
- **Annotation** — highlighted text spans with types (CRUD, NUMBER, etc.)

### Status Flow

```
PENDING → NEW → READY
```

- **PENDING** — audio uploaded, no transcript yet
- **NEW** — transcript added, not yet annotated
- **READY** — annotations saved, ready for export

## Derived Values

Two fields are computed automatically during upload and prefilled as suggestions. Annotators can override them; the override is what gets exported.

### Distance Estimate

- **Method:** RMS (Root Mean Square) signal level.
- **Algorithm:** Decode audio → mono 16kHz float32 PCM → compute RMS → normalize to 0–1.
- **Scale:** 0.0 = speaker far from microphone (quiet), 1.0 = speaker close to microphone (loud).
- **Label:** Displayed as "Distance Est." in the UI. This is an _estimate_, not a physical distance measurement.
- **Override:** Click the value in the Recording Metadata panel to edit. An orange dot indicates a manual override.

## API Endpoints

| Method | Endpoint                            | Description                            |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/api/items`                        | List all audio items with transcripts  |
| POST   | `/api/items/:id/transcript`         | Create a transcript for an audio item  |
| PUT    | `/api/items/:id/transcript`         | Update corrected text and annotations  |
| PUT    | `/api/items/:id/transcript/replace` | Replace entire transcript              |
| DELETE | `/api/items/:id/transcript`         | Delete transcript                      |
| PUT    | `/items/:id/distance-estimate`      | Update distance estimation             |
| POST   | `/api/upload`                       | Upload audio files and transcript JSON |
| GET    | `/api/export`                       | Export gold standard as JSONL          |
| GET    | `/api/health`                       | Health check                           |

## Development (without Docker)

### Backend

```bash
cd backend
yarn install
docker compose up -d          # Start PostgreSQL only
yarn prisma migrate dev       # Run migrations
yarn prisma generate          # Generate Prisma client
yarn dev                      # Start dev server on port 3000
```

### Frontend

```bash
cd frontend
yarn install
yarn dev                      # Start dev server on port 5173
```

## License

MIT
