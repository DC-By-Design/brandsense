"use client";

import { useEffect, useState } from "react";
import { backgroundConfig } from "@/lib/config/background";

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export function BackgroundRenderer() {
  const dark = useDark();
  const cfg = backgroundConfig;

  if (cfg.mode === "solid") {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{ background: dark ? cfg.darkColor : cfg.lightColor }}
      />
    );
  }

  if (cfg.mode === "gradient") {
    return <GradientCycler gradients={dark ? cfg.darkGradients : cfg.lightGradients} interval={cfg.interval} transition={cfg.transition} />;
  }

  if (cfg.mode === "images") {
    return <ImageCycler interval={cfg.interval} transition={cfg.transition} />;
  }

  return null;
}

function GradientCycler({ gradients, interval, transition }: {
  gradients: string[];
  interval: number;
  transition: number;
}) {
  const [index, setIndex] = useState(0);
  const [next, setNext] = useState(1 % gradients.length);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % gradients.length);
        setNext((i) => (i + 2) % gradients.length);
        setFading(false);
      }, transition);
    }, interval);
    return () => clearInterval(timer);
  }, [gradients.length, interval, transition]);

  return (
    <div className="fixed inset-0 -z-10">
      {/* Base layer — current */}
      <div
        className="absolute inset-0"
        style={{ background: gradients[index], willChange: "opacity", transform: "translateZ(0)" }}
      />
      {/* Top layer — next, fades in */}
      <div
        className="absolute inset-0"
        style={{
          background: gradients[next],
          opacity: fading ? 1 : 0,
          transition: `opacity ${transition}ms ease-in-out`,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}

function ImageCycler({ interval, transition }: { interval: number; transition: number }) {
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((d: { images: string[] }) => {
        if (d.images.length > 0) {
          const shuffled = [...d.images].sort(() => Math.random() - 0.5);
          setImages(shuffled);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(3px) brightness(1.05) saturate(1.15)",
            transform: "scale(1.04)",
            opacity: i === activeIndex ? 1 : 0,
            transition: `opacity ${transition}ms ease-in-out`,
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: "rgba(245,245,248,0.22)" }} />
    </div>
  );
}
