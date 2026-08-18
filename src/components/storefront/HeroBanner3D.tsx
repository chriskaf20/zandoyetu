'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { 
  Sparkles, 
  Compass, 
  Move3d, 
  ShoppingBag, 
  RotateCcw,
  Crown,
  Eye
} from 'lucide-react';

interface HeroBanner3DProps {
  title?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export function HeroBanner3D({
  title = 'Haute Couture & Joaillerie Katanga',
  subtitle = 'Chef-d\'œuvre exclusif en 3D temps réel. Observez la rotation continue ou glissez pour explorer les détails à 360°.',
  primaryCtaText = 'Acheter Maintenant',
  primaryCtaLink = '/?category=createurs',
  secondaryCtaText = 'Collection 3D Katanga',
  secondaryCtaLink = '/?category=robes',
}: HeroBanner3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [modelType, setModelType] = useState<'watch' | 'gem'>('watch');

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5.2);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    // 4. Lighting Rig (Katanga Luxury Gold + Platinum Rim Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Main Warm Gold Key Light
    const keyLight = new THREE.DirectionalLight(0xf59e0b, 3.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Cool Platinum/Cyan Rim Light
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 3.2);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // Overhead Accent Light
    const topLight = new THREE.PointLight(0xfffbeb, 2.5, 10);
    topLight.position.set(0, 4, 2);
    scene.add(topLight);

    // 5. Main 3D Model Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- MATERIALS ---
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
    });

    const polishedPlatinumMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.12,
    });

    const darkCeramicMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const emeraldGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.1,
    });

    const sapphireDialMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    // --- SUB-ELEMENT: LUXURY CHRONOGRAPH WATCH ---
    const watchGroup = new THREE.Group();

    // Outer Bezel Ring (Gold)
    const bezelGeom = new THREE.TorusGeometry(1.3, 0.14, 24, 64);
    const bezelMesh = new THREE.Mesh(bezelGeom, goldMaterial);
    watchGroup.add(bezelMesh);

    // Inner Case (Dark Ceramic)
    const caseGeom = new THREE.CylinderGeometry(1.26, 1.26, 0.22, 48);
    caseGeom.rotateX(Math.PI / 2);
    const caseMesh = new THREE.Mesh(caseGeom, darkCeramicMaterial);
    watchGroup.add(caseMesh);

    // Watch Dial Face (Deep Navy Blue / Sapphire)
    const dialGeom = new THREE.CircleGeometry(1.15, 48);
    const dialMesh = new THREE.Mesh(dialGeom, sapphireDialMaterial);
    dialMesh.position.z = 0.12;
    watchGroup.add(dialMesh);

    // Hour Markers (Gold batons)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const markerGeom = new THREE.BoxGeometry(i % 3 === 0 ? 0.08 : 0.04, 0.2, 0.04);
      const markerMesh = new THREE.Mesh(markerGeom, goldMaterial);
      markerMesh.position.set(Math.sin(angle) * 0.95, Math.cos(angle) * 0.95, 0.14);
      markerMesh.rotation.z = -angle;
      watchGroup.add(markerMesh);
    }

    // Sub-dial Chronograph Ring
    const subDialGeom = new THREE.TorusGeometry(0.35, 0.02, 16, 32);
    const subDialMesh = new THREE.Mesh(subDialGeom, polishedPlatinumMaterial);
    subDialMesh.position.set(0, -0.3, 0.14);
    watchGroup.add(subDialMesh);

    // Emerald Center Tourbillon Jewel
    const jewelGeom = new THREE.IcosahedronGeometry(0.18, 1);
    const jewelMesh = new THREE.Mesh(jewelGeom, emeraldGlowMaterial);
    jewelMesh.position.set(0, 0, 0.18);
    watchGroup.add(jewelMesh);

    // Watch Hands (Hours & Minutes)
    const hourHandGeom = new THREE.BoxGeometry(0.06, 0.55, 0.03);
    hourHandGeom.translate(0, 0.27, 0);
    const hourHand = new THREE.Mesh(hourHandGeom, polishedPlatinumMaterial);
    hourHand.position.set(0, 0, 0.16);
    hourHand.rotation.z = -Math.PI / 4;
    watchGroup.add(hourHand);

    const minuteHandGeom = new THREE.BoxGeometry(0.04, 0.8, 0.03);
    minuteHandGeom.translate(0, 0.4, 0);
    const minuteHand = new THREE.Mesh(minuteHandGeom, goldMaterial);
    minuteHand.position.set(0, 0, 0.17);
    minuteHand.rotation.z = Math.PI / 3;
    watchGroup.add(minuteHand);

    // Luxury Bracelet Links (Top & Bottom segments)
    const strapGeom = new THREE.BoxGeometry(1.0, 0.7, 0.16);
    const strapTop = new THREE.Mesh(strapGeom, polishedPlatinumMaterial);
    strapTop.position.set(0, 1.55, -0.05);
    strapTop.rotation.x = 0.25;
    watchGroup.add(strapTop);

    const strapBottom = new THREE.Mesh(strapGeom, polishedPlatinumMaterial);
    strapBottom.position.set(0, -1.55, -0.05);
    strapBottom.rotation.x = -0.25;
    watchGroup.add(strapBottom);

    // Crown button
    const crownGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16);
    crownGeom.rotateZ(Math.PI / 2);
    const crownMesh = new THREE.Mesh(crownGeom, goldMaterial);
    crownMesh.position.set(1.35, 0, 0);
    watchGroup.add(crownMesh);

    // Glowing Halo Orbit Ring
    const haloGeom = new THREE.TorusGeometry(1.8, 0.015, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45 });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = Math.PI / 3;
    watchGroup.add(haloMesh);

    rootGroup.add(watchGroup);

    // 6. Floating High-Fashion Dust Particles (Gold & Diamond Sparkles)
    const particleCount = 90;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
      particlePositions[i + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 7. Interactive Drag & Continuous Turntable Physics
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0.15;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0.007; // Base auto-spin speed

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousPointerX;
      const deltaY = e.clientY - previousPointerY;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.006;
      // Clamp vertical tilt
      targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));

      rotationVelocityY = deltaX * 0.003;
      rotationVelocityX = deltaY * 0.003;

      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // pointer release safe fallback
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous Auto-Spinning & Physics Damping
      if (!isDragging) {
        // Return smoothly to baseline auto-spin speed
        rotationVelocityY = THREE.MathUtils.lerp(rotationVelocityY, 0.0065, 0.04);
        rotationVelocityX = THREE.MathUtils.lerp(rotationVelocityX, 0, 0.05);
        targetRotationY += rotationVelocityY;
      }

      // Apply Smooth Rotations
      rootGroup.rotation.y = THREE.MathUtils.lerp(rootGroup.rotation.y, targetRotationY, 0.1);
      rootGroup.rotation.x = THREE.MathUtils.lerp(rootGroup.rotation.x, targetRotationX, 0.1);

      // Subtle Haute Couture Levitation
      rootGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.12;

      // Internal mechanism subtle rotations
      jewelMesh.rotation.y += 0.02;
      jewelMesh.rotation.x += 0.01;
      haloMesh.rotation.z -= 0.004;

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.03;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);

      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      bezelGeom.dispose();
      caseGeom.dispose();
      dialGeom.dispose();
      jewelGeom.dispose();
      haloGeom.dispose();
      strapGeom.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] bg-gradient-to-br from-neutral-950 via-neutral-900 to-black overflow-hidden rounded-xl shadow-2xl border border-neutral-800 select-none group"
    >
      {/* 3D WebGL Canvas (Continuous Auto-Play + Touch/Drag enabled) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
      />

      {/* Atmospheric Radial Lighting Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-amber-500/5 via-transparent to-black/80 z-10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent z-10" />

      {/* Top Floating Badge: Interactive 3D */}
      <div className="absolute top-4 left-4 sm:left-6 z-20 pointer-events-auto flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Haute Joaillerie 3D • Lubumbashi</span>
        </div>
      </div>

      {/* Top Right Live Rotation Hint */}
      <div className="absolute top-4 right-4 sm:right-6 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] uppercase font-bold text-neutral-300 bg-neutral-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-700 shadow">
        <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Auto-Rotation 360° (Glissez pour tourner)</span>
      </div>

      {/* Bottom Content & CTAs */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20 pointer-events-none">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-1">
            <Crown className="w-3 h-3" /> Édition Maîtres Artisans Katanga
          </div>

          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
            {title}
          </h2>

          <p className="text-xs text-neutral-300 mt-1.5 line-clamp-2 max-w-md drop-shadow">
            {subtitle}
          </p>

          {/* Action CTAs */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 pointer-events-auto">
            <Link
              href={primaryCtaLink}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-amber-300 transition shadow-lg hover:scale-105 active:scale-95 duration-200"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{primaryCtaText}</span>
            </Link>

            <Link
              href={secondaryCtaLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition shadow hover:scale-105 active:scale-95 duration-200"
            >
              <Move3d className="w-3.5 h-3.5 text-amber-400" />
              <span>{secondaryCtaText}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroBanner3D;
