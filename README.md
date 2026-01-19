# Forge ⚒️

**AI-powered app builder** — Describe what you want, watch it build in real-time.

![Forge Screenshot](https://via.placeholder.com/800x400/1a1a2e/6366f1?text=Forge+AI+App+Builder)

## ✨ Features

- **🤖 AI-Powered Generation** — Describe your app in plain English, Claude AI builds it
- **⚡ Real-Time Preview** — See changes instantly as code is written
- **📝 Live Code Editor** — Monaco editor with file tree, syntax highlighting, save
- **💻 Built-in Terminal** — Run commands directly in the browser
- **📦 Export as ZIP** — Download your complete project anytime
- **🚀 One-Click Deploy** — Deploy to Vercel or Netlify (coming soon)

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude (via AI SDK)
- **Runtime**: WebContainers (browser-based Node.js)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Editor**: Monaco Editor

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Anthropic API key

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
   
   Fill in your `.env` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL from `supabase/schema.sql` in your SQL editor

5. **Start the dev server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
forge/
├── app/
│   ├── components/     # React components
│   ├── context/        # React contexts (Auth, Project, WebContainer)
│   ├── lib/            # Utilities and helpers
│   ├── routes/         # Page routes
│   └── store/          # Jotai atoms
├── public/             # Static assets
├── supabase/           # Database schema
└── vercel.json         # Vercel deployment config
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See [deployment guide](docs/deployment.md) for detailed instructions.

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using AI