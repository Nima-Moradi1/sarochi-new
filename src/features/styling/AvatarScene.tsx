"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MathUtils, type Group } from "three";
import type { VisualClass } from "./preview";
import type { StylingPreset } from "@/features/content/brand-settings";

function Avatar({ preset, turn, still, garmentClass, garmentColor, garmentScale }: { preset: StylingPreset | null; turn: number; still: boolean; garmentClass: VisualClass; garmentColor: string; garmentScale: number }) {
  const root = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const idleTime = useRef(0);
  const shoulder = preset?.shoulder ?? 0.47;
  useEffect(() => { if (still && root.current) { root.current.rotation.y = turn * Math.PI / 2; invalidate(); } }, [turn, still, invalidate]);
  useFrame((_state, delta) => {
    if (!root.current) return;
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, turn * Math.PI / 2, 5, delta);
    if (still) return;
    idleTime.current += Math.min(delta, 0.05);
    root.current.position.y = Math.sin(idleTime.current * 1.25) * 0.015;
    if (leftArm.current) leftArm.current.rotation.x = Math.sin(idleTime.current * 1.25) * 0.028;
    if (rightArm.current) rightArm.current.rotation.x = -Math.sin(idleTime.current * 1.25) * 0.028;
  });
  return <group ref={root} position={[0, 0, 0]}>
    <mesh position={[0, 2.4, 0]} castShadow><sphereGeometry args={[0.29, 24, 18]} /><meshStandardMaterial color="#c2a48f" roughness={0.88} /></mesh>
    <mesh position={[0, 2.61, -0.015]} scale={[1.02, 0.42, 1.02]} castShadow><sphereGeometry args={[0.29, 24, 12]} /><meshStandardMaterial color="#292a29" roughness={0.95} /></mesh>
    <mesh position={[0, 2.12, 0]} castShadow><cylinderGeometry args={[0.105, 0.12, 0.21, 16]} /><meshStandardMaterial color="#c2a48f" roughness={0.88} /></mesh>
    <mesh position={[0, 1.51, 0]} castShadow receiveShadow scale={[(preset?.bodyScale ?? 1) * garmentScale, garmentScale, 1]}><boxGeometry args={[garmentClass === "JACKET" ? 0.92 : 0.83, garmentClass === "KNIT" ? 1.2 : 1.13, garmentClass === "JACKET" ? 0.48 : 0.38]} /><meshStandardMaterial color={garmentClass === "PANTS" ? "#d5d7d0" : garmentColor} roughness={garmentClass === "JACKET" ? 0.82 : 0.95} /></mesh>
    {garmentClass === "SHIRT" && <><mesh position={[-0.15, 2.09, 0.22]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.25, 0.07, 0.08]} /><meshStandardMaterial color={garmentColor} /></mesh><mesh position={[0.15, 2.09, 0.22]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.25, 0.07, 0.08]} /><meshStandardMaterial color={garmentColor} /></mesh><mesh position={[0, 1.5, 0.2]}><boxGeometry args={[0.012, 0.94, 0.015]} /><meshStandardMaterial color="#d5d7d0" /></mesh></>}
    {garmentClass === "KNIT" && <mesh position={[0, 2.04, 0.01]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.22, 0.055, 8, 24]} /><meshStandardMaterial color={garmentColor} roughness={1} /></mesh>}
    {garmentClass === "JACKET" && <><mesh position={[-0.17, 1.51, 0.27]} rotation={[0, 0, -0.08]}><boxGeometry args={[0.32, 1.08, 0.06]} /><meshStandardMaterial color={garmentColor} roughness={0.86} /></mesh><mesh position={[0.17, 1.51, 0.27]} rotation={[0, 0, 0.08]}><boxGeometry args={[0.32, 1.08, 0.06]} /><meshStandardMaterial color={garmentColor} roughness={0.86} /></mesh><mesh position={[0, 1.5, 0.31]}><boxGeometry args={[0.02, 0.85, 0.02]} /><meshStandardMaterial color="#d5d7d0" /></mesh></>}
    {([-1, 1] as const).map((side) => <group key={side} ref={side === -1 ? leftArm : rightArm} position={[side * shoulder, 1.92, 0]} rotation={[0, 0, side * 0.08]}>
      <mesh position={[side * 0.04, -0.39, 0]} castShadow><capsuleGeometry args={[0.16, 0.55, 8, 14]} /><meshStandardMaterial color={garmentClass === "TSHIRT" || garmentClass === "PANTS" ? "#c2a48f" : garmentColor} roughness={0.95} /></mesh>
      {garmentClass === "TSHIRT" && <mesh position={[side * 0.015, -0.18, 0]} castShadow><capsuleGeometry args={[0.175 * garmentScale, 0.2, 8, 14]} /><meshStandardMaterial color={garmentColor} roughness={0.95} /></mesh>}
      <mesh position={[side * 0.07, -0.88, 0]} castShadow><sphereGeometry args={[0.11, 14, 10]} /><meshStandardMaterial color="#c2a48f" roughness={0.9} /></mesh>
    </group>)}
    {([-1, 1] as const).map((side) => <group key={side} position={[side * 0.21, 0.62, 0]}>
      <mesh castShadow scale={[garmentClass === "PANTS" ? garmentScale : 1, 1, garmentClass === "PANTS" ? garmentScale : 1]}><capsuleGeometry args={[0.18, 0.78, 8, 14]} /><meshStandardMaterial color={garmentClass === "PANTS" ? garmentColor : "#343936"} roughness={0.95} /></mesh>
      <mesh position={[0, -0.56, 0.13]} castShadow><boxGeometry args={[0.28, 0.15, 0.51]} /><meshStandardMaterial color="#222725" roughness={0.9} /></mesh>
    </group>)}
  </group>;
}

export default function AvatarScene({ preset, turn, still, visible, garmentClass, garmentColor, garmentScale }: { preset: StylingPreset | null; turn: number; still: boolean; visible: boolean; garmentClass: VisualClass; garmentColor: string; garmentScale: number }) {
  return <Canvas shadows dpr={[1, 1.6]} frameloop={visible && !still ? "always" : "demand"} camera={{ position: [0, 1.7, 5.8], fov: 35, near: 0.1, far: 30 }} style={{ touchAction: "pan-y" }}>
    <color attach="background" args={["#e9eee8"]} />
    <ambientLight intensity={1.5} />
    <directionalLight position={[3, 7, 4]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-near={0.1} shadow-camera-far={20} />
    <directionalLight position={[-3, 3, -2]} intensity={1.1} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow><planeGeometry args={[12, 12]} /><meshStandardMaterial color="#e1e8e0" roughness={1} /></mesh>
    <Avatar preset={preset} turn={turn} still={still} garmentClass={garmentClass} garmentColor={garmentColor} garmentScale={garmentScale} />
    <OrbitControls enablePan={false} enableZoom minDistance={4.2} maxDistance={8} minPolarAngle={Math.PI * 0.24} maxPolarAngle={Math.PI * 0.67} target={[0, 1.35, 0]} enableDamping dampingFactor={0.08} />
  </Canvas>;
}
