'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  Compass, 
  Move3d, 
  ShoppingBag, 
  Loader2 
} from 'lucide-react';

interface HeroBanner3DProps {
  sceneUrl?: string;
  title?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export function HeroBanner3D({
  sceneUrl = 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode',
  title = 'Haute Couture & Luxe Katanga',
  subtitle = 'Découvrez notre collection exclusive en 3D temps réel. Faites pivoter et explorez chaque création d\'exception.',
  primaryCtaText = 'Acheter Maintenant',
  primaryCtaLink = '/?category=robes',
  secondaryCtaText = 'Créateurs Katangais',
  secondaryCtaLink = '/?category=createurs',
}: HeroBanner3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let appInstance: any = null;

    async function initSpline() {
      if (!canvasRef.current || typeof window === 'undefined') return;

      try {
        const { Application } = await import('@splinetool/runtime');
        if (!isMounted || !canvasRef.current) return;

        const app = new Application(canvasRef.current);
        appInstance = app;

        await app.load(sceneUrl);
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[HeroBanner3D] Could not initialize 3D scene, rendering fallback visual:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    initSpline();

    return () => {
      isMounted = false;
      try {
        if (appInstance && typeof appInstance.dispose === 'function') {
          appInstance.dispose();
        }
      } catch (e) {
        // ignore disposal errors
      }
    };
  }, [sceneUrl]);

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] bg-neutral-950 overflow-hidden rounded-lg shadow-2xl border border-neutral-800 select-none">
      {/* 3D Canvas */}
      {!hasError && (
        <canvas
          ref={canvasRef}
          className={`w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ touchAction: 'pan-y' }}
        />
      )}

      {/* Loading Spinner Skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white p-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
            <Move3d className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="font-serif text-sm font-semibold text-neutral-200 mt-4">
            Chargement de l'univers 3D...
          </p>
          <span className="text-[10px] text-amber-400/80 uppercase tracking-widest mt-1">
            Haute Couture Lubumbashi
          </span>
        </div>
      )}

      {/* Fallback Image if 3D scene cannot be rendered */}
      {hasError && (
        <div className="relative w-full h-full">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&auto=format&fit=crop&q=80"
            alt="Collection 3D"
            fill
            priority
            className="object-cover object-center opacity-70"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
        </div>
      )}

      {/* Atmospheric Lighting Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent z-10" />
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-b from-black/60 to-transparent z-10" />

      {/* Floating Header Badge */}
      <div className="absolute top-4 left-4 sm:left-6 z-20 pointer-events-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Expérience Interactive 3D</span>
        </div>
      </div>

      {/* 3D Interaction Hint */}
      <div className="absolute top-4 right-4 sm:right-6 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] uppercase font-semibold text-neutral-400 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-neutral-800">
        <Compass className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span>Glissez pour faire pivoter</span>
      </div>

      {/* Foreground Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20 pointer-events-none">
        <div className="max-w-xl">
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-md">
            {title}
          </h2>

          <p className="text-xs text-neutral-300 mt-1.5 line-clamp-2 max-w-md drop-shadow">
            {subtitle}
          </p>

          {/* Floating CTAs */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 pointer-events-auto">
            <Link
              href={primaryCtaLink}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-amber-300 transition shadow-lg hover:scale-105 active:scale-95 duration-200"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{primaryCtaText}</span>
            </Link>

            <Link
              href={secondaryCtaLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-white/20 transition shadow hover:scale-105 active:scale-95 duration-200"
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
