import { useRef } from "react";
import type * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, ContactShadows } from "@react-three/drei";

function Knot() {
    const mesh = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        mesh.current.rotation.x += delta * 0.25;
        mesh.current.rotation.y += delta * 0.4;
    });

    return (
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.9}>
            <mesh ref={mesh}>
                <torusKnotGeometry args={[0.9, 0.3, 140, 24]} />
                <meshStandardMaterial color="#818cf8" metalness={0.85} roughness={0.2} />
            </mesh>
        </Float>
    );
}

export default function MiniBuildScene() {
    return (
        <div className="relative h-full bg-gradient-to-b from-[#0b0b1e] to-black">
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.35} />
                <directionalLight position={[4, 5, 4]} intensity={1.3} color="#e0e7ff" />
                <pointLight position={[-4, -2, -3]} intensity={14} distance={20} color="#a855f7" />
                <Knot />
                <Sparkles count={60} scale={[7, 5, 5]} size={1.8} speed={0.4} opacity={0.5} color="#a5b4fc" />
                <ContactShadows position={[0, -1.7, 0]} opacity={0.45} scale={8} blur={2.4} far={3} />
            </Canvas>

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="w-14 h-2.5 rounded bg-white/70" />
                <div className="flex gap-2">
                    <div className="w-8 h-2 rounded bg-white/20" />
                    <div className="w-8 h-2 rounded bg-white/20" />
                </div>
            </div>
            <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-2.5 px-6 pointer-events-none">
                <div className="w-1/2 h-3.5 rounded bg-white/80" />
                <div className="w-1/3 h-2 rounded bg-white/30" />
                <div className="w-24 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mt-1" />
            </div>
        </div>
    );
}
