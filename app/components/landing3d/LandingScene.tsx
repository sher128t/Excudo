import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const PALETTE = ["#6366f1", "#a855f7", "#ec4899", "#818cf8"];

function useScrollProgress() {
    const progress = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return progress;
}

function Rig({ progress }: { progress: React.MutableRefObject<number> }) {
    const target = useMemo(() => new THREE.Vector3(), []);
    const lookAt = useMemo(() => new THREE.Vector3(), []);

    useFrame(({ camera, pointer }) => {
        const t = progress.current;
        target.set(
            Math.sin(t * Math.PI * 2) * 3 + pointer.x * 0.6,
            -t * 3 + pointer.y * 0.4,
            8 + t * 5
        );
        camera.position.lerp(target, 0.05);
        lookAt.set(0, -t * 4, 0);
        camera.lookAt(lookAt);
    });

    return null;
}

function ClusterShape({
    basePosition,
    geometry,
    color,
    emissive,
    speed,
    progress,
}: {
    basePosition: [number, number, number];
    geometry: React.ReactNode;
    color: string;
    emissive?: string;
    speed: number;
    progress: React.MutableRefObject<number>;
}) {
    const group = useRef<THREE.Group>(null!);
    const mesh = useRef<THREE.Mesh>(null!);
    const base = useMemo(() => new THREE.Vector3(...basePosition), [basePosition]);

    useFrame((_, delta) => {
        const spread = 1 + progress.current * 1.6;
        group.current.position.set(base.x * spread, base.y * spread - progress.current * 4, base.z * spread);
        mesh.current.rotation.x += delta * 0.15 * speed;
        mesh.current.rotation.y += delta * 0.2 * speed;
    });

    return (
        <group ref={group}>
            <Float speed={speed * 1.5} rotationIntensity={0.4} floatIntensity={0.8}>
                <mesh ref={mesh}>
                    {geometry}
                    <meshStandardMaterial
                        color={color}
                        metalness={0.85}
                        roughness={0.18}
                        emissive={emissive ?? "#000000"}
                        emissiveIntensity={emissive ? 1.6 : 0}
                    />
                </mesh>
            </Float>
        </group>
    );
}

function AccentLight({ progress }: { progress: React.MutableRefObject<number> }) {
    const light = useRef<THREE.PointLight>(null!);
    const colors = useMemo(() => PALETTE.map((c) => new THREE.Color(c)), []);
    const mixed = useMemo(() => new THREE.Color(), []);

    useFrame(() => {
        const t = progress.current * (colors.length - 1);
        const i = Math.min(Math.floor(t), colors.length - 2);
        mixed.lerpColors(colors[i], colors[i + 1], t - i);
        light.current.color.copy(mixed);
    });

    return <pointLight ref={light} position={[-6, 2, 2]} intensity={40} distance={30} />;
}

const SHAPES: Array<{
    position: [number, number, number];
    geometry: React.ReactNode;
    color: string;
    emissive?: string;
    speed: number;
}> = [
    { position: [4.6, 0.4, -0.5], geometry: <torusKnotGeometry args={[1.35, 0.42, 180, 28]} />, color: "#7c7ff7", speed: 0.9 },
    { position: [-4.8, -0.4, -1], geometry: <icosahedronGeometry args={[1.15, 0]} />, color: "#a855f7", speed: 1.1 },
    { position: [-3.9, 1.9, -2.5], geometry: <torusGeometry args={[0.75, 0.26, 24, 64]} />, color: "#6366f1", speed: 1.2 },
    { position: [5.6, -2.2, -2.5], geometry: <octahedronGeometry args={[0.9, 0]} />, color: "#ec4899", speed: 1.2 },
    { position: [-6, 1, -4], geometry: <dodecahedronGeometry args={[0.7, 0]} />, color: "#38bdf8", speed: 1.5 },
    { position: [6.2, 2.2, -4], geometry: <icosahedronGeometry args={[0.65, 1]} />, color: "#8b5cf6", speed: 0.9 },
    { position: [-2.6, -2.6, -3], geometry: <icosahedronGeometry args={[0.4, 0]} />, color: "#f0abfc", emissive: "#d946ef", speed: 1.8 },
    { position: [2.8, 2.8, -3.5], geometry: <octahedronGeometry args={[0.45, 0]} />, color: "#c7d2fe", emissive: "#6366f1", speed: 1.5 },
    { position: [0.4, -0.6, -7], geometry: <torusGeometry args={[1, 0.32, 24, 64]} />, color: "#4f46e5", speed: 0.7 },
];

export default function LandingScene() {
    const progress = useScrollProgress();

    return (
        <Canvas
            camera={{ position: [0, 0, 8], fov: 55 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
        >
            <fog attach="fog" args={["#030308", 9, 26]} />
            <ambientLight intensity={0.25} />
            <directionalLight position={[6, 6, 6]} intensity={1.1} color="#e0e7ff" />
            <AccentLight progress={progress} />
            <pointLight position={[5, -4, -4]} intensity={20} distance={25} color="#ec4899" />

            {SHAPES.map((shape, index) => (
                <ClusterShape
                    key={index}
                    basePosition={shape.position}
                    geometry={shape.geometry}
                    color={shape.color}
                    emissive={shape.emissive}
                    speed={shape.speed}
                    progress={progress}
                />
            ))}

            <Sparkles count={180} scale={[18, 14, 12]} size={2.2} speed={0.35} opacity={0.55} color="#a5b4fc" />
            <Stars radius={60} depth={40} count={1500} factor={3} saturation={0} fade speed={0.6} />
            <Rig progress={progress} />

            <EffectComposer>
                <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.25} luminanceSmoothing={0.65} />
            </EffectComposer>
        </Canvas>
    );
}
