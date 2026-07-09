// Starter templates mounted into the WebContainer for every new project.
// The AI only writes files inside src/ - config files are pre-baked so
// builds are fast and never broken by malformed scaffolding.

export type ProjectStyle = "traditional" | "immersive3d";

export const DEFAULT_PROJECT_STYLE: ProjectStyle = "traditional";

export function normalizeProjectStyle(value: unknown): ProjectStyle {
    return value === "immersive3d" ? "immersive3d" : DEFAULT_PROJECT_STYLE;
}

const TRADITIONAL_TEMPLATE_FILES: Record<string, string> = {
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

const IMMERSIVE_3D_TEMPLATE_FILES: Record<string, string> = {
    ...TRADITIONAL_TEMPLATE_FILES,

    "package.json": JSON.stringify(
        {
            name: "excudo-3d-app",
            private: true,
            version: "1.0.0",
            type: "module",
            scripts: {
                dev: "vite",
                build: "vite build",
                preview: "vite preview",
            },
            dependencies: {
                "@react-three/drei": "^10.7.7",
                "@react-three/fiber": "^9.6.1",
                "@react-three/postprocessing": "^3.0.4",
                "@vitejs/plugin-react": "^4.3.1",
                autoprefixer: "^10.4.20",
                "lucide-react": "^0.441.0",
                postcss: "^8.4.41",
                react: "^18.3.1",
                "react-dom": "^18.3.1",
                "react-router-dom": "^6.26.0",
                tailwindcss: "^3.4.10",
                three: "^0.185.1",
                vite: "^5.4.2",
            },
            devDependencies: {},
        },
        null,
        2
    ),

    "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #050505;
}

canvas {
  touch-action: none;
}
`,

    "src/orbit/kit.jsx": `import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  Float,
  Sparkles,
  Stars,
  ContactShadows,
  Text,
  MeshDistortMaterial,
  useGLTF,
  Clone,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

const LIGHT_PRESETS = {
  studio: { ambient: 0.5, key: '#ffffff', keyIntensity: 1.4, rim: '#e0e7ff', accent: '#94a3b8' },
  moody: { ambient: 0.15, key: '#c7d2fe', keyIntensity: 0.8, rim: '#312e81', accent: '#6366f1' },
  neon: { ambient: 0.1, key: '#f0abfc', keyIntensity: 0.7, rim: '#22d3ee', accent: '#d946ef' },
  sunset: { ambient: 0.35, key: '#fed7aa', keyIntensity: 1.2, rim: '#fb923c', accent: '#f472b6' },
};

export function Lighting({ preset = 'studio', accent }) {
  const p = LIGHT_PRESETS[preset] || LIGHT_PRESETS.studio;
  return (
    <group>
      <ambientLight intensity={p.ambient} />
      <directionalLight position={[6, 8, 5]} intensity={p.keyIntensity} color={p.key} />
      <directionalLight position={[-6, 4, -6]} intensity={0.5} color={p.rim} />
      <pointLight position={[-5, -2, 3]} intensity={30} distance={25} color={accent || p.accent} />
    </group>
  );
}

export function Atmosphere({ color = '#050505', particles = 150, particleColor = '#a5b4fc', stars = true, fogNear = 8, fogFar = 30 }) {
  return (
    <group>
      <fog attach="fog" args={[color, fogNear, fogFar]} />
      {particles > 0 && <Sparkles count={particles} scale={[16, 12, 10]} size={2} speed={0.35} opacity={0.55} color={particleColor} />}
      {stars && <Stars radius={60} depth={40} count={1500} factor={3} saturation={0} fade speed={0.5} />}
    </group>
  );
}

export function CameraParallax({ strength = 0.6, y = 0, z = 6 }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, pointer }) => {
    target.set(pointer.x * strength, y + pointer.y * strength * 0.6, z);
    camera.position.lerp(target, 0.05);
    camera.lookAt(0, y, 0);
  });
  return null;
}

export function Spin({ speed = 0.3, axis = 'y', children }) {
  const group = useRef();
  useFrame((_, delta) => {
    group.current.rotation[axis] += delta * speed;
  });
  return <group ref={group}>{children}</group>;
}

export function Pulse({ amount = 0.06, speed = 2, children }) {
  const group = useRef();
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * speed) * amount;
    group.current.scale.setScalar(s);
  });
  return <group ref={group}>{children}</group>;
}

const GEOMETRIES = {
  sphere: <sphereGeometry args={[1, 48, 48]} />,
  box: <boxGeometry args={[1.4, 1.4, 1.4]} />,
  torus: <torusGeometry args={[1, 0.35, 24, 64]} />,
  torusKnot: <torusKnotGeometry args={[0.9, 0.3, 160, 24]} />,
  icosahedron: <icosahedronGeometry args={[1, 0]} />,
  octahedron: <octahedronGeometry args={[1.1, 0]} />,
};

export function FloatingShape({ kind = 'icosahedron', size = 1, color = '#818cf8', emissive, distort = 0, position = [0, 0, 0], speed = 1, metalness = 0.85, roughness = 0.18 }) {
  const mesh = useRef();
  useFrame((_, delta) => {
    mesh.current.rotation.x += delta * 0.15 * speed;
    mesh.current.rotation.y += delta * 0.22 * speed;
  });
  return (
    <group position={position} scale={size}>
      <Float speed={speed * 1.6} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh ref={mesh}>
          {GEOMETRIES[kind] || GEOMETRIES.icosahedron}
          {distort > 0 ? (
            <MeshDistortMaterial color={color} distort={distort} speed={2} metalness={metalness} roughness={roughness} />
          ) : (
            <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} emissive={emissive || '#000000'} emissiveIntensity={emissive ? 1.6 : 0} />
          )}
        </mesh>
      </Float>
    </group>
  );
}

export function ShapeField({ count = 10, spread = 9, colors = ['#6366f1', '#a855f7', '#ec4899', '#38bdf8'], minSize = 0.15, maxSize = 0.45 }) {
  const items = useMemo(() => {
    const rand = mulberry32(1337);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.8;
      const radius = spread * (0.45 + rand() * 0.55);
      return {
        position: [Math.cos(angle) * radius, (rand() - 0.5) * spread * 0.7, -1 - rand() * spread * 0.6],
        size: minSize + rand() * (maxSize - minSize),
        color: colors[i % colors.length],
        speed: 0.8 + rand() * 1.2,
        kind: ['icosahedron', 'octahedron', 'sphere'][i % 3],
      };
    });
  }, [count, spread, colors, minSize, maxSize]);
  return <group>{items.map((item, i) => <FloatingShape key={i} {...item} />)}</group>;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function GroundShadow({ y = -1.8, opacity = 0.5, scale = 12, blur = 2.5 }) {
  return <ContactShadows position={[0, y, 0]} opacity={opacity} scale={scale} blur={blur} far={4} />;
}

export function NeonText({ children, size = 1, color = '#ffffff', position = [0, 0, 0], glow = false, maxWidth = 10 }) {
  return (
    <Text position={position} fontSize={size} maxWidth={maxWidth} textAlign="center" anchorX="center" anchorY="middle" color={color} material-toneMapped={!glow}>
      {children}
    </Text>
  );
}

const MODEL_LIBRARY_BASE = 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models';

export function Model({ name, url, size = 2.5, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const src = url || MODEL_LIBRARY_BASE + '/' + name + '/model.gltf';
  const { scene } = useGLTF(src);
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const dims = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
    const s = size / maxDim;
    return { scale: s, offset: [-center.x * s, -center.y * s, -center.z * s] };
  }, [scene, size]);
  return (
    <group position={position} rotation={rotation}>
      <group position={offset} scale={scale}>
        <Clone object={scene} />
      </group>
    </group>
  );
}

export function Glow({ intensity = 0.8, threshold = 0.25 }) {
  return (
    <EffectComposer>
      <Bloom mipmapBlur intensity={intensity} luminanceThreshold={threshold} luminanceSmoothing={0.65} />
      <Vignette eskil={false} offset={0.15} darkness={0.75} />
    </EffectComposer>
  );
}
`,

    "src/App.jsx": `import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Lighting, Atmosphere, FloatingShape, GroundShadow, Glow } from './orbit/kit.jsx';

export default function App() {
  return (
    <div className="h-full w-full relative">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />
        <Lighting preset="moody" />
        <Atmosphere particles={120} />
        <FloatingShape kind="torusKnot" color="#6366f1" size={1.1} />
        <GroundShadow />
        <OrbitControls enableDamping minDistance={3} maxDistance={10} />
        <Glow />
      </Canvas>
      <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
        <p className="text-slate-500 text-sm tracking-wide">Your 3D site is being generated...</p>
      </div>
    </div>
  );
}
`,
};

export function getTemplateFiles(projectStyle: ProjectStyle = DEFAULT_PROJECT_STYLE): Record<string, string> {
    return projectStyle === "immersive3d" ? IMMERSIVE_3D_TEMPLATE_FILES : TRADITIONAL_TEMPLATE_FILES;
}

export const TEMPLATE_FILES = TRADITIONAL_TEMPLATE_FILES;

const TRADITIONAL_TEMPLATE_SUMMARY = `The project starts from a pre-mounted Vite + React 18 + Tailwind CSS 3 template:
- package.json (react, react-dom, react-router-dom@6, lucide-react + vite/tailwind tooling - already installed)
- vite.config.js, tailwind.config.js, postcss.config.js, index.html (DO NOT recreate these)
- src/main.jsx (renders src/App.jsx - only edit if you need providers/routers at the root)
- src/index.css (Tailwind directives - extend with custom CSS if needed)
- src/App.jsx (placeholder - REPLACE this with the real app)`;

const IMMERSIVE_3D_TEMPLATE_SUMMARY = `The project starts from a pre-mounted Vite + React 18 + Tailwind CSS 3 template with React Three Fiber:
- package.json (react, react-dom, react-router-dom@6, lucide-react, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing + vite/tailwind tooling - already installed)
- vite.config.js, tailwind.config.js, postcss.config.js, index.html (DO NOT recreate these)
- src/main.jsx (renders src/App.jsx - only edit if you need providers/routers at the root)
- src/index.css (Tailwind directives + full-viewport reset: html/body/#root are height:100%, margin:0, overflow:hidden, dark background - keep this base intact)
- src/orbit/kit.jsx (Orbit Kit - prebuilt polished components incl. <Model> for loading real 3D models from the model library; do not rewrite it, import from './orbit/kit.jsx')
- src/App.jsx (placeholder scene built with the kit - REPLACE this with the real site: a full-viewport <Canvas> plus HTML overlay UI)
- For multi-section sites use drei's <ScrollControls pages={N}> inside the Canvas with overlay sections in <Scroll html> - no extra packages needed`;

export function getTemplateSummary(projectStyle: ProjectStyle = DEFAULT_PROJECT_STYLE): string {
    return projectStyle === "immersive3d" ? IMMERSIVE_3D_TEMPLATE_SUMMARY : TRADITIONAL_TEMPLATE_SUMMARY;
}

export const TEMPLATE_SUMMARY = TRADITIONAL_TEMPLATE_SUMMARY;
