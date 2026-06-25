import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const QuantumSwarm = () => {
  const meshRef = useRef();
  const count = 20000;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) {
        pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     }
     return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const R = 50;
  const r = 15;
  const P = 2;
  const Q = 5;
  const numBlocks = 350;
  const pLen = 7.0;
  const pSize = 2.5;
  const stagger = 4.0;
  const extraTwist = 1.5;
  const flow = 0.3;

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Instead of scrolling, let's keep the standard time for this one since it's a flowing knot
    // Or we can slow it down slightly so it's a calm background
    const time = state.clock.getElapsedTime() * 0.5;

    const stardustRatio = 0.05;
    const numStardust = count * stardustRatio;
    
    const gRx = time * 0.11;
    const gRy = time * 0.17;
    const cgx = Math.cos(gRx), sgx = Math.sin(gRx);
    const cgy = Math.cos(gRy), sgy = Math.sin(gRy);

    for(let i=0; i<count; i++) {
        if (i < numStardust) {
            const raw1 = Math.sin(i * 11.11) * 43758.54;
            const sd1 = raw1 - Math.floor(raw1);
            const raw2 = Math.cos(i * 22.22) * 43758.54;
            const sd2 = raw2 - Math.floor(raw2);
            const raw3 = Math.sin(i * 33.33) * 43758.54;
            const sd3 = raw3 - Math.floor(raw3);
        
            const radiusDist = R * 1.2 + sd1 * 80.0;
            const theta = sd2 * Math.PI * 2.0;
            const phi = Math.acos(sd3 * 2.0 - 1.0);
        
            const driftX = Math.sin(time * 0.2 + i * 0.1) * 10.0;
            const driftY = Math.cos(time * 0.25 + i * 0.1) * 10.0;
            const driftZ = Math.sin(time * 0.15 + i * 0.2) * 10.0;
        
            const sx = radiusDist * Math.sin(phi) * Math.cos(theta) + driftX;
            const sy = radiusDist * Math.sin(phi) * Math.sin(theta) + driftY;
            const sz = radiusDist * Math.cos(phi) + driftZ;
        
            const y1 = sy * cgx - sz * sgx;
            const z1 = sy * sgx + sz * cgx;
            const x2 = sx * cgy + z1 * sgy;
            const y2 = y1;
            const z2 = -sx * sgy + z1 * cgy;
        
            target.set(x2, y2, z2);
        
            const twinkle = Math.pow((Math.sin(time * 3.0 + i) + 1.0) * 0.5, 8.0);
            color.setHSL(0.5 + sd1 * 0.1, 0.8, 0.05 + twinkle * 0.8);
        } else {
            const remainingCount = count - numStardust;
            const iRem = i - numStardust;
            
            const blocksSafe = Math.max(1, numBlocks);
            const ppb = remainingCount / blocksSafe;
            const blockId = Math.floor(iRem / ppb);
            const localId = iRem - blockId * ppb;
        
            const wireRatio = 0.85;
            const numWire = ppb * wireRatio;
            const isWire = localId < numWire;
        
            const tBase = (blockId / blocksSafe) * Math.PI * 2.0;
            const t = tBase + time * flow * 0.1;
        
            const cosQt = Math.cos(Q * t);
            const sinQt = Math.sin(Q * t);
            const cosPt = Math.cos(P * t);
            const sinPt = Math.sin(P * t);
        
            const px = (R + r * cosQt) * cosPt;
            const py = (R + r * cosQt) * sinPt;
            const pz = r * sinQt;
        
            let tx = -P * (R + r * cosQt) * sinPt - Q * r * sinQt * cosPt;
            let ty =  P * (R + r * cosQt) * cosPt - Q * r * sinQt * sinPt;
            let tz =  Q * r * cosQt;
            const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) + 0.0001;
            tx /= tLen; ty /= tLen; tz /= tLen;
        
            const nx_torus = cosPt;
            const ny_torus = sinPt;
            const nz_torus = 0.0;
        
            let bx = ty * nz_torus - tz * ny_torus;
            let by = tz * nx_torus - tx * nz_torus;
            let bz = tx * ny_torus - ty * nx_torus;
            const bLen = Math.sqrt(bx * bx + by * by + bz * bz) + 0.0001;
            bx /= bLen; by /= bLen; bz /= bLen;
        
            let nx = by * tz - bz * ty;
            let ny = bz * tx - bx * tz;
            let nz = bx * ty - by * tx;
        
            const twistAngle = tBase * extraTwist + time * flow * 0.5;
            const cosTw = Math.cos(twistAngle);
            const sinTw = Math.sin(twistAngle);
        
            const fnx = nx * cosTw - bx * sinTw;
            const fny = ny * cosTw - by * sinTw;
            const fnz = nz * cosTw - bz * sinTw;
        
            const fbx = nx * sinTw + bx * cosTw;
            const fby = ny * sinTw + by * cosTw;
            const fbz = nz * sinTw + bz * cosTw;
        
            const track = blockId % 4;
            const c1 = track % 2 === 0 ? 1.0 : -1.0;
            const c2 = Math.floor(track / 2) === 0 ? 1.0 : -1.0;
            
            const cx = px + fnx * c1 * stagger + fbx * c2 * stagger;
            const cy = py + fny * c1 * stagger + fby * c2 * stagger;
            const cz = pz + fnz * c1 * stagger + fbz * c2 * stagger;
        
            let lx = 0.0, ly = 0.0, lz = 0.0;
            let u = 0.0;
        
            if (isWire) {
                const edgePosRaw = (localId / numWire) * 12.0;
                const edgeId = Math.min(11, Math.floor(edgePosRaw));
                u = (edgePosRaw - edgeId) * 2.0 - 1.0;
        
                const axis = edgeId % 3;
                const corner = Math.floor(edgeId / 3);
                const e1 = (corner % 2 === 0) ? -1.0 : 1.0;
                const e2 = (Math.floor(corner / 2) === 0) ? -1.0 : 1.0;
        
                if (axis === 0) { lx = u; ly = e1; lz = e2; }
                else if (axis === 1) { lx = e1; ly = u; lz = e2; }
                else { lx = e1; ly = e2; lz = u; }
            } else {
                const rawS1 = Math.sin(localId * 12.989 + blockId * 78.233) * 43758.545;
                const rawS2 = Math.cos(localId * 39.346 + blockId * 53.211) * 43758.545;
                const rawS3 = Math.sin(localId * 73.156 + blockId * 12.742) * 43758.545;
                const rawS4 = Math.cos(localId * 23.456 + blockId * 89.123) * 43758.545;
                
                const s1 = rawS1 - Math.floor(rawS1);
                const s2 = rawS2 - Math.floor(rawS2);
                const s3 = rawS3 - Math.floor(rawS3);
                const s4 = rawS4 - Math.floor(rawS4);
        
                const faceAxis = Math.min(2, Math.floor(s1 * 3.0));
                const signFace = s2 > 0.5 ? 1.0 : -1.0;
                const u2 = s3 * 2.0 - 1.0;
                const v2 = s4 * 2.0 - 1.0;
        
                u = 0.0; 
        
                if (faceAxis === 0) { lx = signFace; ly = u2; lz = v2; }
                else if (faceAxis === 1) { lx = u2; ly = signFace; lz = v2; }
                else { lx = u2; ly = v2; lz = signFace; }
            }
        
            lx *= pLen;
            ly *= pSize;
            lz *= pSize;
        
            const fx = cx + lx * tx + ly * fnx + lz * fbx;
            const fy = cy + lx * ty + ly * fny + lz * fby;
            const fz = cz + lx * tz + ly * fnz + lz * fbz;
        
            const y1 = fy * cgx - fz * sgx;
            const z1 = fy * sgx + fz * cgx;
            const x2 = fx * cgy + z1 * sgy;
            const y2 = y1;
            const z2 = -fx * sgy + z1 * cgy;
        
            target.set(x2, y2, z2);
        
            const trackOffset = (track / 4.0) * 0.08;
            const hue = 0.5 + trackOffset + Math.sin(tBase * P * 2.0 + time) * 0.02;
            
            let sat = isWire ? 0.95 : 0.5;
            let lit = isWire ? 0.3 : 0.02;
        
            if (isWire) {
                const pulseEnv = Math.sin(tBase * P * 12.0 - time * 5.0);
                if (pulseEnv > 0.8) {
                    lit += (pulseEnv - 0.8) * 3.0;
                }
                
                const isCorner = Math.abs(u) > 0.90 ? 1.0 : 0.0;
                lit += isCorner * 0.6;
                sat -= isCorner * 0.8;
            }
        
            color.setHSL(hue % 1.0, Math.min(1.0, Math.max(0.0, sat)), Math.min(1.0, Math.max(0.0, lit)));
        }

        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Initialize colors once
  useEffect(() => {
    if (meshRef.current) {
      for(let i=0; i<count; i++) {
        meshRef.current.setColorAt(i, new THREE.Color(0x00ff88));
      }
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]}>
    </instancedMesh>
  );
};

export default function QuantumBackground() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', background: '#060C20' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }} gl={{ powerPreference: 'high-performance', antialias: true }}>
        <fogExp2 attach="fog" args={[0x000000, 0.01]} />
        <QuantumSwarm />
        <Effects disableGamma>
          <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
        <OrbitControls enableDamping autoRotate autoRotateSpeed={2.0} enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
