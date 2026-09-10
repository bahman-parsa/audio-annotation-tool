1. TypeScript 6 instead of 7. TS 7 is yet incompatible with Yarn 4's nodeLinker: node-modules setup. TS 6 + strict mode gives all needed features without the migration pain.

2. Layered architecture without a repository layer. 3-tier (routes → controllers → services → Prisma) instead of 4-tier. Prisma already acts as a query builder/repository; adding another abstraction layer would be redundant indirection for a small project.

3. WaveSurfer.js over the HTML5 Audio API. WaveSurfer provides waveform visualization, region selection, and precise time-based interaction out of the box. HTML5 Audio gives basic playback only.

4. Custom transcript-annotator.ts over external library. A ~150-line module keeps the logic self-contained and testable. If I had more time I would have tried to use Tiptap as text annotator. I could not find alternative text-annotator libs for Vue. For example tiptap-annotation-magic and @ghentcdh/vue-component-annotated-text lack good community support. With clear prompts to my agentic AI clarifying the requirements of a text-annotator that suits our web app, I could quickly create transcript-annotator.ts.

5. Multer memoryStorage over diskStorage. I refactored from diskStorage policy to memoryStorage, as I assume the audio files that will be imported later are small (<50MB), no need to write to disk before validation. Processing from buffer means upload + validate + store is one pass. The comprehensive upload tests made this refactor safe.

6. Separate PostgreSQL test database. Isolates test data from dev data, runs on port 5433 with its own Docker volume. Allows running tests without affecting working state.

7. Yarn 4 with nodeLinker: node-modules. Yarn Berry's PnP mode requires .pnp.cjs and isn't compatible with many Node.js toolchains. node-modules linker gives deterministic installs with zero compatibility issues.

8. Test coverage is not sufficient, but to demonstrate how tests should be written, I focused on writing tests for the upload functionality in the frontend and the api/upload route in the backend. Adding E2E tests with Playwright or Cypress would also be very beneficial.
