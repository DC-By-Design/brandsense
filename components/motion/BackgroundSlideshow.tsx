"use client";

import { useEffect, useState } from "react";

// Fallback Pexels images used when /public/backgrounds/ is empty
const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/3109816/pexels-photo-3109816.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/1568607/pexels-photo-1568607.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/3246665/pexels-photo-3246665.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/2693212/pexels-photo-2693212.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/3648307/pexels-photo-3648307.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/2860804/pexels-photo-2860804.jpeg?auto=compress&cs=tinysrgb&w=1920",
];

const INTERVAL_MS = 8000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BackgroundSlideshow() {
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then(({ images: local }: { images: string[] }) => {
        setImages(shuffle(local.length > 0 ? local : FALLBACK_IMAGES));
      })
      .catch(() => setImages(shuffle(FALLBACK_IMAGES)));
  }, []);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            filter: "blur(3px) brightness(1.05) saturate(1.15)",
            transform: "scale(1.04)",
            opacity: i === activeIndex ? 1 : 0,
            transition: "opacity 2.8s ease-in-out",
          }}
        />
      ))}
      {/* Minimal veil to keep readability without killing colour */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(245, 245, 248, 0.22)" }}
      />
    </div>
  );
}
