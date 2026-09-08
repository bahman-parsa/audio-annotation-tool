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

frontend/
  public/              # Static assets (favicon, icons)
  src/
    components/        # Reusable UI components
    composables/       # State management and utilities
    layouts/           # Page layouts
    pages/             # Route-level pages
    router/            # Vue Router config
    services/          # API client
    types/             # Shared TypeScript types
  index.html           # Vite HTML entry
  package.json         # Dependencies and scripts
  vite.config.ts       # Vite config with @ alias and dev proxy
  tsconfig.json        # TypeScript config
  env.d.ts             # Vite client types
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

### Frontend
```bash
cd frontend
yarn install
yarn dev                      # Start dev server on port 5173
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

### Frontend
- Vue 3 Composition API with `<script setup lang="ts">` — all components
- `@/` alias for all intra-project imports (configured in vite.config.ts and tsconfig)
- No Pinia/Vuex — singleton composables for cross-component state, instance-scoped composables for local state
- Tailwind CSS v4 utility classes in templates (single `@import "tailwindcss"` in style.css)
- `import type` for type-only imports
- Native `fetch` via centralized `api.ts` service (generic typed methods)
- Centralized types in `types/index.ts`

### Naming
- Backend files: kebab-case (e.g., `audio.routes.ts`)
- Prisma models: PascalCase (e.g., `AudioItem`)
- Database columns: camelCase (e.g., `audioItemId`)

## Data Model

The data model is defined in `backend/prisma/schema.prisma`. 

## Design Decisions

- **Duration from audio header:** Server reads duration using `music-metadata`. Client-sent duration is not trusted.
- **Singleton composables over store library:** Only two pieces of cross-component state (work queue, audio player). Module-scope refs provide shared-state semantics without the overhead of a store library.
- **Inline modals over Teleport:** At most one modal open at a time. `fixed inset-0 z-50` overlays within the owning component keep the DOM simple and avoid event inheritance issues.
- **WaveSurfer.js composable separation:** Audio playback state and controls live in `useAudioPlayer.ts` (singleton), while DOM integration lives in `AudioPlayer.vue`. The WaveSurfer instance is held in a `shallowRef` to avoid deep reactivity on a complex external object.