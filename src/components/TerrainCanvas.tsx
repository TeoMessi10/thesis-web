"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useMotion";

/**
 * 3D-graverat kurslandskap (canvas 2D, perspektivprojektion).
 * ROWS 44 · COLS 96 · DPR-tak 1,75 · vermilion-rygg med glöd + pulserande
 * slutpunkt · mässingslinje var 8:e rad · korslinjer var 8:e kolumn.
 * Ritar bara när komponenten är i viewport och fliken är synlig.
 * Reduced motion ⇒ en statisk frame.
 *
 * OBS: canvas är ett imperativt API — useRef + requestAnimationFrame
 * i useEffect ÄR React-mönstret här. Konvertera inte detta till state.
 */
const ROWS = 44;
const COLS = 96;
const XW = 3.4;
const Z0 = 1.1;
const Z1 = 8.4;

export default function TerrainCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let mx = 0;
    let t = 2.7;
    let last = performance.now();
    let visible = true;
    let raf = 0;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw();
    };

    const height = (x: number, z: number, time: number): number => {
      let y =
        0.4 * Math.sin(x * 0.9 + time * 0.42 + z * 0.7) * Math.cos(z * 0.8 - time * 0.3) +
        0.18 * Math.sin(x * 2.1 - z * 1.6 + time * 0.66) +
        0.1 * Math.sin(x * 3.7 + z * 2.9 - time * 0.9);
      const rx = Math.sin(time * 0.17) * 1.4;
      y += 0.85 * Math.exp(-((x - rx) * (x - rx)) / 0.55) * (0.6 + 0.4 * Math.sin(z * 1.1 - time * 0.5));
      y += 0.14 * Math.sin(z * 0.5 - time * 0.12);
      return y * 0.62;
    };

    const pt = { x: 0, y: 0, ok: true };
    const project = (x: number, y: number, z: number, yaw: number) => {
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const xr = x * cy - z * sy;
      const zr = x * sy + z * cy;
      const zc = zr + 0.4;
      if (zc < 0.3) {
        pt.ok = false;
        return;
      }
      const f = H * 0.92;
      pt.x = W * 0.5 + (xr / zc) * f * 0.62;
      pt.y = H * 0.3 + ((1.15 - y) / zc) * f * 0.85;
      pt.ok = true;
    };

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const yaw = Math.sin(t * 0.05) * 0.1 + mx * 0.16;
      const ridgeRow = Math.round(ROWS * 0.55);

      for (let r = ROWS - 1; r >= 0; r--) {
        const z = Z0 + (Z1 - Z0) * (r / (ROWS - 1));
        const depth = 1 - r / (ROWS - 1);
        const isRidge = r === ridgeRow;
        const isBrass = !isRidge && r % 8 === 3;
        const alpha = 0.035 + depth * 0.125;

        if (isRidge) {
          ctx.strokeStyle = "rgba(255,79,46,.9)";
          ctx.lineWidth = 1.6;
          ctx.shadowColor = "rgba(255,79,46,.8)";
          ctx.shadowBlur = 16;
        } else {
          ctx.strokeStyle = isBrass
            ? `rgba(201,160,99,${(alpha * 1.25).toFixed(3)})`
            : `rgba(242,234,219,${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        let pen = false;
        let lastX = 0;
        let lastY = 0;
        for (let c = 0; c <= COLS; c++) {
          const x = -XW + 2 * XW * (c / COLS);
          project(x, height(x, z, t), z, yaw);
          if (!pt.ok) {
            pen = false;
            continue;
          }
          if (!pen) {
            ctx.moveTo(pt.x, pt.y);
            pen = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
          lastX = pt.x;
          lastY = pt.y;
        }
        ctx.stroke();

        if (isRidge && pen) {
          const pr = 3.2 + Math.sin(t * 2.4) * 1.1;
          ctx.beginPath();
          ctx.fillStyle = "rgba(255,79,46,1)";
          ctx.arc(lastX, lastY, pr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(242,234,219,.045)";
      const yaw2 = Math.sin(t * 0.05) * 0.1 + mx * 0.16;
      for (let c = 0; c <= COLS; c += 8) {
        const x = -XW + 2 * XW * (c / COLS);
        ctx.beginPath();
        let pen = false;
        for (let r = 0; r < ROWS; r++) {
          const z = Z0 + (Z1 - Z0) * (r / (ROWS - 1));
          project(x, height(x, z, t), z, yaw2);
          if (!pt.ok) {
            pen = false;
            continue;
          }
          if (!pen) {
            ctx.moveTo(pt.x, pt.y);
            pen = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !document.hidden) {
        t += dt;
        draw();
      }
      raf = requestAnimationFrame(frame);
    };

    const onMouse = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
    };

    resize();
    window.addEventListener("resize", resize);

    let io: IntersectionObserver | undefined;
    if (!reduced) {
      if (fine) window.addEventListener("mousemove", onMouse, { passive: true });
      io = new IntersectionObserver((es) => {
        visible = es[0]?.isIntersecting ?? true;
      });
      io.observe(canvas);
      raf = requestAnimationFrame(frame);
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      io?.disconnect();
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full [mask-image:linear-gradient(180deg,transparent_0,#000_9%,#000_70%,transparent_99%)] ${className}`}
    />
  );
}
