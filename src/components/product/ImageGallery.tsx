'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const safeImages = images && images.length > 0 ? images : ['https://placehold.co/600x750/png?text=Zando+Yetu'];
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[500px] no-scrollbar">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-20 flex-shrink-0 rounded overflow-hidden border-2 transition ${
                idx === selectedIndex ? 'border-brand-black shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Active Image with 4:5 Portrait Ratio */}
      <div className="relative flex-1 aspect-[4/5] bg-brand-lightGray rounded overflow-hidden shadow-sm">
        <Image
          src={safeImages[selectedIndex]}
          alt={title}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
