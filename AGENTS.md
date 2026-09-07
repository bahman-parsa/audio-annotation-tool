# Audio Transcription Annotation Tool

## Project Purpose

Medical audio annotation tool for German clinical speech-to-text. Doctors dictate operation reports; a speech model produces a first-pass transcript. Annotators correct and enrich these transcripts to create a gold standard for model evaluation and fine-tuning.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node 22 |
| Language | TypeScript 6 (strict mode, ES modules) |
| Backend | Express 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 (via Docker Compose) |
| Frontend | Vue 3 (Composition API, `<script setup>`) |
| Styling | Tailwind CSS v4 |
| Audio | WaveSurfer.js 7 |
| Build | Vite 8 |
| Package Mgr | Yarn 4.12.0 |

## Project Structure

```
backend/
  src/
    routes/            # Express route definitions
    controllers/       # Request handlers
    services/          # Business logic
    repositories/      # Database queries (Prisma)
    middleware/        # Express middleware
    dtos/              # Data transfer objects
    lib/prisma.ts      # Prisma client singleton
    config.ts          # Environment config (PORT, DATABASE_URL, UPLOAD_DIR)
    app.ts             # Express app setup (cors, json, routes, error handling)
    index.ts           # Server entry point
  prisma/
    schema.prisma      # Data model (AudioItem, Transcript, Annotation)
  uploads/             # Stored audio files (gitignored)
  .env                 # DATABASE_URL, PORT
```

## Build & Run

### Prerequisites
- Node.js 22+
- Docker (for PostgreSQL)
- Yarn 4.12.0

### Backend
```bash
cd backend
yarn install
docker compose up -d          # Start PostgreSQL
yarn prisma migrate dev       # Run migrations
yarn prisma generate          # Generate Prisma client
yarn dev                      # Start dev server on port 3000
```

### Database
```bash
# From project root
docker compose up -d          # Start PostgreSQL on port 5432
docker compose down           # Stop PostgreSQL
docker compose down -v        # Stop and remove volumes
```

## Code Conventions

### Backend
- TypeScript 6 strict mode, ES modules (`"type": "module"` in package.json)
- Module resolution: `"module": "nodenext"`
- Express 5 with async error handling (errors bubble to global error handler)
- Prisma client singleton in `src/lib/prisma.ts` (avoids multiple connections in dev)
- Routes → Controllers → Services → Repositories layered architecture
- File uploads stored in `uploads/` directory (referenced in DB, not bytes)

### Naming
- Backend files: kebab-case (e.g., `audio.routes.ts`)
- Prisma models: PascalCase (e.g., `AudioItem`)
- Database columns: camelCase (e.g., `audioItemId`)

## Data Model

The data model is defined in `backend/prisma/schema.prisma`. 

## Design Decisions

- **Duration from audio header:** Server reads duration using `music-metadata`. Client-sent duration is not trusted.