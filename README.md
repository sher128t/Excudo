# Excudo

AI-powered app builder for creating polished React websites and apps from plain English prompts.

Excudo runs a full browser-based development environment with WebContainers, streams Claude tool calls into real project files, starts the generated app live in an embedded preview, and saves each project to Supabase. Users can choose between a traditional React/Tailwind build or an immersive 3D experience powered by React Three Fiber.

## Current Product

- **Classic and 3D project styles** - Users can choose a traditional website/app or an immersive 3D experience before generation.
- **Upgraded Classic generation** - Traditional builds now use a stronger design prompt, sparse-prompt expansion, design-system primitives, better layout variance, and purposeful motion guidance.
- **3D generation path** - 3D builds include React Three Fiber, Drei, postprocessing, Orbit Kit primitives, lighting, atmosphere, scroll scenes, and model-library support.
- **AI code generation** - Claude creates and updates complete React files through streamed tool calls.
- **Live WebContainer preview** - Generated apps install dependencies, run in-browser, and appear in the editor preview.
- **Automatic error repair** - Build, install, and runtime errors are captured and sent back through the AI repair flow without exposing raw logs or a manual fix button by default.
- **Project-aware follow-up edits** - The AI can inspect the existing file tree and read files before editing.
- **Expandable prompt inputs** - Landing, dashboard, and editor prompt boxes expand as users type longer prompts.
- **Version history** - AI edits are snapshotted so users can roll back to earlier versions.
- **Built-in editor and terminal** - Monaco editor, file tree, xterm terminal, and manual file editing are available inside the workspace.
- **Planning mode** - Chat-only mode for brainstorming and refining an idea before building.
- **Project dashboard** - Users can create, rename, delete, reopen, and manage saved projects.
- **Export and publish** - Projects can be downloaded as ZIP files or published through the Netlify deployment API.
- **Credits and tiers** - Supabase-backed profile and credit system with free and paid-tier behavior.
- **Authentication** - Supabase Auth with profile onboarding.

## Tech Stack

| Layer | Technology |
| --- | --- |
| App framework | React 19, React Router v7, TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude through Vercel AI SDK |
| Browser runtime | WebContainers |
| 3D | Three.js, React Three Fiber, Drei, postprocessing |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth |
| Editor | Monaco Editor |
| Terminal | xterm.js |
| State | React Context, Jotai |
| App hosting | Vercel with COOP/COEP headers |
| Generated-site publishing | Netlify API |
| Icons | Lucide React |

## Project Structure

```text
forge/
  app/
    components/
      landing3d/             3D landing-page scenes
      ActionChips.tsx        Quick prompt actions for edits and polish
      ChatInterface.tsx      AI chat, tool execution, auto-repair trigger
      CodeEditor.tsx         Monaco editor wrapper
      DeployModal.tsx        Generated-site deploy UI
      Preview.tsx            Live iframe preview and repair state
      Sidebar.tsx            File tree
      Terminal.tsx           Browser terminal
      VersionHistory.tsx     Snapshot and rollback UI
    context/
      AuthContext.tsx        Auth/session state
      ProjectContext.tsx     Project CRUD and persistence
      WebContainerContext.tsx WebContainer lifecycle, install, dev server, error capture
    lib/
      auth.server.ts         Server auth and credit checks
      credits.ts             Credit usage helpers
      export.ts              ZIP export
      projects.ts            Project persistence helpers
      supabase.ts            Browser Supabase client
      supabase.server.ts     Server Supabase clients
      template.ts            Classic and 3D starter templates
      types.ts               Shared app types and tier config
    routes/
      landing.tsx            Public landing page
      dashboard.tsx          Authenticated project dashboard
      editor.tsx             Main builder workspace
      projects.tsx           Project list
      pricing.tsx            Pricing page
      api.chat.ts            Claude streaming endpoint and system prompts
      api.deploy.ts          Netlify publish endpoint
      api.generate-title.ts  Project title generation
    store/
      atoms.ts               Jotai atoms
    root.tsx                 App shell and providers
  supabase/
    schema.sql               Tables, policies, triggers, and migrations
  vercel.json                Vercel config and WebContainer headers
  Dockerfile                 Container build
  .env.example               Required environment variables
```

## Generation Modes

### Classic

Classic mode builds standard React and Tailwind websites/apps. The prompt layer is designed to avoid generic AI-SaaS layouts and instead infer a more specific brief from short prompts. It encourages:

- audience and product-specific design choices
- realistic copy and sample data
- varied section layouts instead of repeated card grids
- real UI artifacts, tables, forms, workflows, or relevant imagery instead of colored placeholders
- purposeful hover, focus, reveal, stagger, and state-change animations
- consistent typography, spacing, radius, color, and density

### 3D

3D mode builds immersive React Three Fiber experiences. The starter template includes an Orbit Kit with lighting, atmosphere, floating shapes, scroll scene helpers, glow/postprocessing, and model loading support. It is intended for portfolios, product showcases, interactive brand pages, experiential landing pages, and visual demos.

## How It Works

1. A user signs up or logs in through Supabase Auth.
2. The user enters a prompt on the landing page or dashboard and selects Classic or 3D.
3. Excudo creates a project, mounts the matching starter template, and sends the prompt to `/api/chat`.
4. Claude streams tool calls such as `createFile`, `updateFile`, `deleteFile`, `readFile`, `listFiles`, and `runCommand`.
5. The client executes those tool calls against the WebContainer file system.
6. When generation finishes, Excudo installs dependencies and starts the dev server in the browser.
7. The preview iframe shows the running app.
8. Files, chat history, and version snapshots are saved back to Supabase.
9. If the dev server reports an error, Excudo captures the recent log output and sends an internal repair request back to the AI.
10. Users can keep editing, roll back, export a ZIP, or publish through Netlify.

## AI Models

| Mode | Model | Purpose |
| --- | --- | --- |
| Fast | Claude Haiku 4.5 | Quick generation and free-tier builds |
| Thinking | Claude Sonnet 4.6 | Higher-quality paid-tier builds |
| Plan | Claude Haiku 4.5 | Chat-only planning without code changes |

Free users are kept on Fast mode for builds. Paid users can use Thinking mode.

## Environment Variables

Create `.env` from `.env.example` and fill in:

```text
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
NETLIFY_AUTH_TOKEN=
```

`NETLIFY_AUTH_TOKEN` is only required for one-click publish of generated projects. The Excudo app itself is configured for Vercel.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Supabase project
- Anthropic API key
- Netlify personal access token if publish is enabled

### Install

```bash
git clone https://github.com/sher128t/Excudo.git
cd Excudo
npm install
cp .env.example .env
```

Fill in `.env`, then set up the database:

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the contents of `supabase/schema.sql`.
4. Confirm the profile, project, chat, version, and deployment fields are present.

Start the local app:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## WebContainer Headers

WebContainers require cross-origin isolation headers:

```text
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These are configured in `vercel.json` for production. The local React Router/Vite dev server handles local development.

## Useful Scripts

```bash
npm run dev        # Start local development
npm run typecheck  # Generate route types and run TypeScript
npm run build      # Production build
npm run start      # Serve the built app
```

## Deployment

### Excudo App

The main Excudo app is intended to run on Vercel:

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add the environment variables from `.env.example`.
4. Deploy.

The included `vercel.json` sets the WebContainer headers required for the browser runtime.

### Generated Projects

Generated projects are published through `app/routes/api.deploy.ts` using the Netlify API. A project ZIP is uploaded to Netlify, and the live URL is saved back to Supabase.

## Notes

- The package name is still `forge`, but the product and deployed app are Excudo.
- The Classic generator is intentionally opinionated so short prompts still produce more purposeful designs.
- The 3D generator should only be selected when a visual, spatial, or immersive experience is desired.
- Auto-repair is best-effort: if the same error repeats unchanged, Excudo avoids looping forever and leaves the project state available for manual follow-up.

## License

MIT License.
