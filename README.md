# Excudo ⚒️

**AI-powered app builder** — Describe what you want, watch it build in real-time.

Excudo is a browser-based development environment that uses Claude AI to generate full React applications from natural language prompts. It runs a complete Node.js environment in the browser via WebContainers, so you can see your app come to life as the AI writes the code.

## Features

- **AI Code Generation** — Describe your app in plain English and Claude builds a complete React + Tailwind project on top of a pre-baked Vite starter template
- **Real-Time Preview** — See your app update live in an embedded browser as files are generated
- **AI Error Fixing** — Build errors from the dev server are detected automatically; one click sends them to the AI to find and fix the root cause
- **Project-Aware Edits** — The AI can list and read your project files (`readFile`/`listFiles` tools), so follow-up edits are grounded in real code
- **Version History** — Every AI edit is snapshotted; roll back to any previous version from the editor
- **One-Click Publish** — Build and deploy your app to a live `*.netlify.app` URL straight from the editor
- **Built-in Code Editor** — Monaco editor with file tree, syntax highlighting, and inline editing (manual saves persist to your project)
- **Integrated Terminal** — Full shell running in the browser via WebContainers
- **Planning Mode** — Brainstorm and refine ideas with AI before building
- **Project Management** — Save, rename, delete, and revisit projects from a dashboard
- **Export as ZIP** — Download your complete project source at any time
- **Tiered Credits System** — Free tier with daily credits, paid tiers for more usage
- **Auth & Profiles** — Email/password signup with Supabase Auth, user profiles, and onboarding

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19, React Router v7 (SSR), TypeScript |
| **Styling** | Tailwind CSS v4 |
| **AI** | Anthropic Claude (via Vercel AI SDK) |
| **In-Browser Runtime** | WebContainers (browser-based Node.js) |
| **Database** | Supabase (PostgreSQL + Row Level Security) |
| **Auth** | Supabase Auth (email/password) |
| **Code Editor** | Monaco Editor |
| **State Management** | Jotai, React Context |
| **Deployment** | Vercel (with COOP/COEP headers for WebContainers) |
| **Icons** | Lucide React |

## Project Structure

```
forge/
├── app/
│   ├── components/        # UI components
│   │   ├── ChatInterface.tsx   # AI chat with tool-call streaming
│   │   ├── CodeEditor.tsx      # Monaco editor wrapper
│   │   ├── Preview.tsx         # Live iframe preview
│   │   ├── Sidebar.tsx         # File tree explorer
│   │   ├── Terminal.tsx        # xterm.js terminal
│   │   ├── Header.tsx          # Editor toolbar
│   │   ├── UserMenu.tsx        # Account dropdown
│   │   ├── OnboardingModal.tsx # First-run name prompt
│   │   ├── FileAttachModal.tsx # Image attachment UI
│   │   ├── CreditsDisplay.tsx  # Daily credit counter
│   │   └── ActionChips.tsx     # Quick-action suggestions
│   ├── context/           # React context providers
│   │   ├── AuthContext.tsx          # Auth state & Supabase session
│   │   ├── ProjectContext.tsx       # Project CRUD operations
│   │   └── WebContainerContext.tsx  # WebContainer lifecycle
│   ├── lib/               # Utilities
│   │   ├── supabase.ts          # Browser Supabase client
│   │   ├── supabase.server.ts   # Server Supabase client (SSR)
│   │   ├── types.ts             # TypeScript types & tier config
│   │   ├── credits.ts           # Credit tracking logic
│   │   ├── projects.ts          # Project DB helpers
│   │   └── export.ts            # ZIP export utility
│   ├── routes/            # Page & API routes
│   │   ├── landing.tsx          # Marketing landing page
│   │   ├── dashboard.tsx        # Project dashboard
│   │   ├── editor.tsx           # Main editor workspace
│   │   ├── projects.tsx         # All projects list
│   │   ├── auth.login.tsx       # Login page
│   │   ├── auth.signup.tsx      # Signup page
│   │   ├── auth.callback.tsx    # OAuth callback
│   │   ├── api.chat.ts          # AI streaming endpoint
│   │   └── api.generate-title.ts # AI title generation
│   ├── store/             # Jotai atoms
│   └── root.tsx           # App shell & providers
├── supabase/
│   └── schema.sql         # Database schema, RLS policies, triggers
├── vercel.json            # Vercel config (COOP/COEP headers)
├── Dockerfile             # Multi-stage Docker build
└── .env.example           # Required environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Supabase](https://supabase.com) account (free tier works)
- [Anthropic](https://console.anthropic.com) API key
- [Netlify](https://app.netlify.com/user/applications#personal-access-tokens) personal access token (optional — required for one-click publish)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/forge.git
   cd forge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your `.env` with your actual keys — see [`.env.example`](.env.example) for the required variables.

4. **Set up the database**
   - Create a new Supabase project
   - Go to the SQL Editor and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
   - This creates the `profiles`, `projects`, `chats`, and `project_versions` tables with Row Level Security
   - If you have an existing database, run the migration statements at the bottom of `schema.sql` instead

5. **Start the dev server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

> [!NOTE]
> WebContainers require specific HTTP headers (`Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`). These are configured in `vercel.json` for production. Your local Vite dev server handles this automatically.

## How It Works

1. **User signs up** → Supabase Auth creates account, DB trigger auto-creates profile with free tier
2. **User describes an app** → Prompt is sent to the `/api/chat` endpoint
3. **Claude generates code** → Using tool calls (`createFile`, `updateFile`, `deleteFile`, `runCommand`) streamed back to the client
4. **Files are written to WebContainer** → Browser-based Node.js environment receives files in real-time
5. **Dev server starts** → `npm install && npm run dev` runs inside WebContainer
6. **Live preview updates** → Embedded iframe shows the running app
7. **Project auto-saves** → Files and chat history persist to Supabase

## AI Models

| Mode | Model | Use Case |
|------|-------|----------|
| **Fast** | Claude Haiku 4.5 | Quick generation, free tier |
| **Thinking** | Claude Sonnet 4.5 | Complex projects, paid tiers |
| **Plan** | Claude Haiku 4.5 | Chat-only brainstorming, no code generation |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

The `vercel.json` is pre-configured with the required COOP/COEP headers for WebContainers.

### Docker

```bash
docker build -t excudo .
docker run -p 3000:3000 --env-file .env excudo
```

## License

MIT License — feel free to use for personal or commercial projects.

## Contributing

Contributions welcome! Please open an issue or PR.
