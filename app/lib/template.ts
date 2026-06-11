// Starter template mounted into the WebContainer for every new project.
// The AI only writes files inside src/ — config files are pre-baked so
// builds are fast and never broken by malformed scaffolding.

export const TEMPLATE_FILES: Record<string, string> = {
    "package.json": JSON.stringify(
        {
            name: "excudo-app",
            private: true,
            version: "1.0.0",
            type: "module",
            scripts: {
                dev: "vite",
                build: "vite build",
                preview: "vite preview",
            },
            dependencies: {
                react: "^18.3.1",
                "react-dom": "^18.3.1",
                "react-router-dom": "^6.26.0",
                "lucide-react": "^0.441.0",
            },
            devDependencies: {
                "@vitejs/plugin-react": "^4.3.1",
                vite: "^5.4.2",
                tailwindcss: "^3.4.10",
                postcss: "^8.4.41",
                autoprefixer: "^10.4.20",
            },
        },
        null,
        2
    ),

    "vite.config.js": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
});
`,

    "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,

    "postcss.config.js": `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,

    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,

    "src/main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,

    "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}
`,

    "src/App.jsx": `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
      <p>Your app is being generated...</p>
    </div>
  );
}
`,
};

// Compact description of the template injected into the system prompt
export const TEMPLATE_SUMMARY = `The project starts from a pre-mounted Vite + React 18 + Tailwind CSS 3 template:
- package.json (react, react-dom, react-router-dom@6, lucide-react + vite/tailwind tooling - already installed)
- vite.config.js, tailwind.config.js, postcss.config.js, index.html (DO NOT recreate these)
- src/main.jsx (renders src/App.jsx - only edit if you need providers/routers at the root)
- src/index.css (Tailwind directives - extend with custom CSS if needed)
- src/App.jsx (placeholder - REPLACE this with the real app)`;
