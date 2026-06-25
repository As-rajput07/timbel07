import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const ParticleSwarm = () => {
  const meshRef = useRef();
  const count = 20000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor; 
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.3), []);

  const PARAMS = useMemo(() => ({"gridDensity":40,"sep":4.0,"dropLength":30,"speedBase":90,"rotationSpeed":0.2}), []);
  const addControl = (id, l, min, max, val) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };

  const scrollRef = useRef(0);
  const currentTime = useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Smoothly interpolate time based on scroll position
    // Each pixel scrolled adds 0.005 to "time"
    const targetTime = scrollRef.current * 0.005;
    currentTime.current = THREE.MathUtils.lerp(currentTime.current, targetTime, 0.08);
    const time = currentTime.current;

    if(material.uniforms && material.uniforms.uTime) {
         material.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i++) {
        const gridDensity = addControl("gridDensity", "Grid Size XZ", 10, 100, 40);
        const sep = addControl("sep", "Stream Spacing", 1.0, 10.0, 4.0);
        const dropLength = addControl("dropLength", "Code String Length", 5, 100, 30);
        const speedBase = addControl("speedBase", "Fall Speed", 20, 300, 90);
        const rotationSpeed = addControl("rotationSpeed", "Cube Spin", 0.1, 2.0, 0.2);
        
        const numStreams = gridDensity * gridDensity;
        const streamId = i % numStreams;
        const pId = Math.floor(i / numStreams);
        
        if (pId >= dropLength) {
            target.set(0, 0, 0);
            color.setRGB(0,0,0);
        } else {
            let gridX = streamId % gridDensity;
            let gridZ = Math.floor(streamId / gridDensity);
            const off = (gridDensity * sep) / 2;
        
            const posX = gridX * sep - off;
            const posZ = gridZ * sep - off;
        
            const randOffset = Math.sin(streamId * 34.1234) * 1000.0;
            const fallSpeed = speedBase * (0.6 + Math.abs(Math.cos(streamId * 78.4321)) * 0.8);
        
            const boundsY = gridDensity * sep;
            const halfBoundsY = boundsY / 2;
            const spacingY = sep * 0.8;
        
            const headY = (-( (time + randOffset) * fallSpeed) % boundsY + boundsY) % boundsY;
            let posY = ((headY + pId * spacingY) % boundsY + boundsY) % boundsY - halfBoundsY;
        
            const angle = time * rotationSpeed;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
        
            const rotatedX = posX * cosA - posZ * sinA;
            const rotatedZ = posX * sinA + posZ * cosA;
        
            const tiltAngle = 0.4;
            const cosT = Math.cos(tiltAngle);
            const sinT = Math.sin(tiltAngle);
        
            const finalY = posY * cosT - rotatedZ * sinT;
            const finalZ = posY * sinT + rotatedZ * cosT;
        
            target.set(rotatedX, finalY, finalZ);
        
            const isHead = pId === 0 ? 1.0 : 0.0;
            const tailFade = pId / dropLength;
        
            // Match the Timetable Detector brand: Violet / Emerald
            const isEmerald = streamId % 7 === 0;
            const hue = isEmerald ? 0.44 : 0.675; // 0.675 = #635BFF (Violet), 0.44 = #10B981 (Emerald Green)
            const sat = 1.0 - isHead * 0.8;
            const flicker = Math.max(0.0, Math.sin(time * 20.0 + i * 0.5)) * 0.15;
        
            const light = isHead * 0.98 + (1.0 - isHead) * Math.max(0.01, 0.5 - tailFade * 1.0 + flicker);
        
            // Fade out particles that are far back or far down
            const fade = Math.max(0, 1.0 - (Math.abs(finalZ) / 80));
            color.setHSL(hue, sat, light * fade * 0.6); // Reduced overall opacity/lightness for background
        }
        
        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default function ParticleBackground() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', background: '#060C20' }}>
      <Canvas camera={{ position: [0, -10, 100], fov: 60 }} gl={{ alpha: false, antialias: false }}>
        <fog attach="fog" args={['#060C20', 30, 140]} />
        <ParticleSwarm />
        <Effects disableGamma>
            <unrealBloomPass threshold={0} strength={1.2} radius={0.5} />
        </Effects>
      </Canvas>
    </div>
  );
}
