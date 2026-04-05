"use client";

import { useEffect, useRef } from "react";

const CHARS = "01/\\|-_.,:;+·×÷≡≈~^<>{}[]";
const CELL = 18;       // px per grid cell
const OPACITY = 0.055; // very subtle on light bg
const MIN_LIFE = 120;  // frames before a cell can change
const MAX_LIFE = 400;
const FADE_SPEED = 0.018;

interface Cell {
  char: string;
  alpha: number;    // 0–1
  targetAlpha: number;
  life: number;
  maxLife: number;
}

export function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let cols = 0;
    let rows = 0;
    let cells: Cell[][] = [];

    function randChar() {
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }

    function makeCell(): Cell {
      return {
        char: randChar(),
        alpha: 0,
        targetAlpha: Math.random() * 0.6 + 0.2, // 0.2–0.8
        life: 0,
        maxLife: Math.floor(Math.random() * (MAX_LIFE - MIN_LIFE) + MIN_LIFE),
      };
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / CELL) + 1;
      rows = Math.ceil(canvas.height / CELL) + 1;

      // Preserve existing cells, fill new ones
      const next: Cell[][] = [];
      for (let r = 0; r < rows; r++) {
        next[r] = [];
        for (let c = 0; c < cols; c++) {
          next[r][c] = cells[r]?.[c] ?? makeCell();
        }
      }
      cells = next;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${CELL - 4}px "GeistMono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r][c];

          // Fade toward target
          if (cell.alpha < cell.targetAlpha) {
            cell.alpha = Math.min(cell.alpha + FADE_SPEED, cell.targetAlpha);
          }

          cell.life++;

          // When life expires, start fading out and prepare new char
          if (cell.life >= cell.maxLife) {
            cell.targetAlpha = 0;
            if (cell.alpha <= 0.01) {
              cells[r][c] = makeCell();
            }
          }

          const alpha = cell.alpha * OPACITY;
          if (alpha < 0.002) continue;

          ctx.fillStyle = `rgba(40,40,40,${alpha})`;
          ctx.fillText(
            cell.char,
            c * CELL + CELL / 2,
            r * CELL + CELL / 2
          );
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
