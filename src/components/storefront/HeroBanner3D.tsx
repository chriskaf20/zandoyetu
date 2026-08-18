'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { 
  Sparkles, 
  Compass, 
  Move3d, 
  ShoppingBag, 
  Crown,
  Flame
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
  title = 'Hoodies & Tendances Urbaines',
  subtitle = 'Découvrez nos hoodies surdimensionnés et collections exclusives des créateurs de Lubumbashi en 3D interactif.',
  primaryCtaText = 'Commander le Hoodie',
  primaryCtaLink = '/?search=hoodie',
  secondaryCtaText = 'Créateurs Katangais',
  secondaryCtaLink = '/?category=createurs',
}: HeroBanner3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    camera.position.set(0, 0, 5.4);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // 4. Lighting Rig (High-Fashion Studio Rim Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Key Light (Warm Katanga Gold)
    const keyLight = new THREE.DirectionalLight(0xf59e0b, 3.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Rim Light (Cool Platinum/Cyan Metallic Highlight)
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 3.5);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // Top Overhead Light (Illuminates hood & shoulders)
    const topLight = new THREE.PointLight(0xfffbeb, 3.0, 10);
    topLight.position.set(0, 4, 2);
    scene.add(topLight);

    // Fill Light (Soft subtle ambient from bottom)
    const fillLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    fillLight.position.set(0, -4, 2);
    scene.add(fillLight);

    // 5. 3D Model Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- MATERIALS ---
    // Premium Heavyweight Cotton Fabric Material (Obsidian Black)
    const hoodieFabricMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.78,
      metalness: 0.08,
    });

    // Dark Ribbed Fabric for Cuffs & Hem
    const ribbedMaterial = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.85,
      metalness: 0.05,
    });

    // Katanga Gold Foil / Embroidery Material
    const goldFoilMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
    });

    // Metallic Aglet / Cord Tips
    const metallicGoldAglet = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
    });

    // --- CREATE 3D HOODIE STRUCTURE ---
    const hoodieGroup = new THREE.Group();

    // A. Main Torso (Oversized Boxy Silhouette)
    const torsoGeom = new THREE.CylinderGeometry(0.88, 0.96, 1.45, 32);
    const torsoMesh = new THREE.Mesh(torsoGeom, hoodieFabricMaterial);
    torsoMesh.position.set(0, -0.15, 0);
    hoodieGroup.add(torsoMesh);

    // B. Ribbed Bottom Hem
    const hemGeom = new THREE.CylinderGeometry(0.97, 0.97, 0.18, 32);
    const hemMesh = new THREE.Mesh(hemGeom, ribbedMaterial);
    hemMesh.position.set(0, -0.92, 0);
    hoodieGroup.add(hemMesh);

    // C. Kangaroo Pocket (Front Pouch)
    const pocketGeom = new THREE.BoxGeometry(0.85, 0.42, 0.22);
    pocketGeom.rotateX(0.08);
    const pocketMesh = new THREE.Mesh(pocketGeom, hoodieFabricMaterial);
    pocketMesh.position.set(0, -0.45, 0.85);
    hoodieGroup.add(pocketMesh);

    // Pocket Gold Accent Stitch Line
    const pocketStitchGeom = new THREE.BoxGeometry(0.87, 0.02, 0.23);
    pocketStitchGeom.rotateX(0.08);
    const pocketStitchMesh = new THREE.Mesh(pocketStitchGeom, goldFoilMaterial);
    pocketStitchMesh.position.set(0, -0.24, 0.86);
    hoodieGroup.add(pocketStitchMesh);

    // D. Dropped Shoulder Sleeves (Left & Right)
    // Left Sleeve
    const leftSleeveGeom = new THREE.CylinderGeometry(0.34, 0.24, 1.25, 24);
    leftSleeveGeom.rotateZ(-0.45);
    leftSleeveGeom.rotateX(0.12);
    const leftSleeveMesh = new THREE.Mesh(leftSleeveGeom, hoodieFabricMaterial);
    leftSleeveMesh.position.set(1.15, -0.25, 0.05);
    hoodieGroup.add(leftSleeveMesh);

    const leftCuffGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 24);
    leftCuffGeom.rotateZ(-0.45);
    leftCuffGeom.rotateX(0.12);
    const leftCuffMesh = new THREE.Mesh(leftCuffGeom, ribbedMaterial);
    leftCuffMesh.position.set(1.58, -0.72, 0.1);
    hoodieGroup.add(leftCuffMesh);

    // Right Sleeve
    const rightSleeveGeom = new THREE.CylinderGeometry(0.34, 0.24, 1.25, 24);
    rightSleeveGeom.rotateZ(0.45);
    rightSleeveGeom.rotateX(0.12);
    const rightSleeveMesh = new THREE.Mesh(rightSleeveGeom, hoodieFabricMaterial);
    rightSleeveMesh.position.set(-1.15, -0.25, 0.05);
    hoodieGroup.add(rightSleeveMesh);

    const rightCuffGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 24);
    rightCuffGeom.rotateZ(0.45);
    rightCuffGeom.rotateX(0.12);
    const rightCuffMesh = new THREE.Mesh(rightCuffGeom, ribbedMaterial);
    rightCuffMesh.position.set(-1.58, -0.72, 0.1);
    hoodieGroup.add(rightCuffMesh);

    // E. Realistic Fabric Hood (Back Head Covering)
    const hoodOuterGeom = new THREE.SphereGeometry(0.68, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.75);
    hoodOuterGeom.rotateX(-0.35);
    const hoodOuterMesh = new THREE.Mesh(hoodOuterGeom, hoodieFabricMaterial);
    hoodOuterMesh.position.set(0, 0.75, -0.15);
    hoodieGroup.add(hoodOuterMesh);

    // Hood Collar Rim
    const hoodRimGeom = new THREE.TorusGeometry(0.48, 0.12, 16, 32);
    hoodRimGeom.rotateX(Math.PI / 2.3);
    const hoodRimMesh = new THREE.Mesh(hoodRimGeom, hoodieFabricMaterial);
    hoodRimMesh.position.set(0, 0.62, 0.15);
    hoodieGroup.add(hoodRimMesh);

    // F. Golden Drawstrings & Metal Aglets
    // Left Cord
    const leftCordGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 12);
    leftCordGeom.rotateZ(0.1);
    const leftCordMesh = new THREE.Mesh(leftCordGeom, goldFoilMaterial);
    leftCordMesh.position.set(-0.16, 0.22, 0.88);
    hoodieGroup.add(leftCordMesh);

    const leftAgletGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12);
    leftAgletGeom.rotateZ(0.1);
    const leftAgletMesh = new THREE.Mesh(leftAgletGeom, metallicGoldAglet);
    leftAgletMesh.position.set(-0.19, -0.12, 0.88);
    hoodieGroup.add(leftAgletMesh);

    // Right Cord
    const rightCordGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.72, 12);
    rightCordGeom.rotateZ(-0.08);
    const rightCordMesh = new THREE.Mesh(rightCordGeom, goldFoilMaterial);
    rightCordMesh.position.set(0.16, 0.18, 0.88);
    hoodieGroup.add(rightCordMesh);

    const rightAgletGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12);
    rightAgletGeom.rotateZ(-0.08);
    const rightAgletMesh = new THREE.Mesh(rightAgletGeom, metallicGoldAglet);
    rightAgletMesh.position.set(0.19, -0.2, 0.88);
    hoodieGroup.add(rightAgletMesh);

    // G. Dynamic Chest Graphic Texture ("KATANGA 243 / ZANDO")
    const graphicCanvas = document.createElement('canvas');
    graphicCanvas.width = 512;
    graphicCanvas.height = 512;
    const ctx = graphicCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 512, 512);

      // Gold Katanga Insignia
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 432, 432);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 56px serif';
      ctx.textAlign = 'center';
      ctx.fillText('KATANGA', 256, 170);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('ZANDO YETU', 256, 230);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('+243 • LUXE', 256, 310);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px sans-serif';
      ctx.fillText('LUBUMBASHI COUTURE', 256, 370);
    }

    const graphicTexture = new THREE.CanvasTexture(graphicCanvas);
    graphicTexture.anisotropy = 8;

    const chestGraphicMaterial = new THREE.MeshStandardMaterial({
      map: graphicTexture,
      roughness: 0.6,
      metalness: 0.2,
    });

    const chestGraphicGeom = new THREE.PlaneGeometry(0.72, 0.72);
    const chestGraphicMesh = new THREE.Mesh(chestGraphicGeom, chestGraphicMaterial);
    chestGraphicMesh.position.set(0, 0.12, 0.89);
    hoodieGroup.add(chestGraphicMesh);

    // H. Floating Orbit Halo Ring (Katanga Amber Light)
    const haloGeom = new THREE.TorusGeometry(1.75, 0.018, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = Math.PI / 3.2;
    hoodieGroup.add(haloMesh);

    rootGroup.add(hoodieGroup);

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
    let targetRotationX = 0.05;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0.008; // Base auto-spin speed

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
      targetRotationX = Math.max(-0.4, Math.min(0.4, targetRotationX));

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

    // 8. Animation & Render Loop (Auto-play immediately on mount)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous Auto-Spinning & Physics Damping
      if (!isDragging) {
        // Return smoothly to baseline auto-spin speed
        rotationVelocityY = THREE.MathUtils.lerp(rotationVelocityY, 0.008, 0.04);
        rotationVelocityX = THREE.MathUtils.lerp(rotationVelocityX, 0, 0.05);
        targetRotationY += rotationVelocityY;
      }

      // Apply Smooth Rotations
      rootGroup.rotation.y = THREE.MathUtils.lerp(rootGroup.rotation.y, targetRotationY, 0.1);
      rootGroup.rotation.x = THREE.MathUtils.lerp(rootGroup.rotation.x, targetRotationX, 0.1);

      // Subtle Haute Couture Levitation
      rootGroup.position.y = Math.sin(elapsedTime * 2.0) * 0.15;

      // Drawstring subtle floating wave
      leftCordMesh.rotation.x = Math.sin(elapsedTime * 2.5) * 0.08;
      rightCordMesh.rotation.x = Math.cos(elapsedTime * 2.5) * 0.08;
      haloMesh.rotation.z -= 0.004;

      // Slowly rotate particle dust
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
      torsoGeom.dispose();
      hemGeom.dispose();
      pocketGeom.dispose();
      leftSleeveGeom.dispose();
      rightSleeveGeom.dispose();
      hoodOuterGeom.dispose();
      hoodRimGeom.dispose();
      leftCordGeom.dispose();
      rightCordGeom.dispose();
      chestGraphicGeom.dispose();
      haloGeom.dispose();
      graphicTexture.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
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

      {/* Top Floating Badge: Streetwear & Haute Couture */}
      <div className="absolute top-4 left-4 sm:left-6 z-20 pointer-events-auto flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>STREETWEAR & HAUTE COUTURE • LUBUMBASHI</span>
        </div>
      </div>

      {/* Top Right Live Rotation Hint */}
      <div className="absolute top-4 right-4 sm:right-6 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] uppercase font-bold text-neutral-300 bg-neutral-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-700 shadow">
        <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Vue 3D 360° (Glissez pour tourner)</span>
      </div>

      {/* Bottom Content & CTAs */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20 pointer-events-none">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-1">
            <Flame className="w-3 h-3 text-red-500 fill-red-500" /> Collection Exclusive Katanga 2026
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
