'use client';

import { useEffect, useRef } from 'react';

/**
 * Floating paper lanterns background for the Love Wall.
 * Soft, warm, anonymous — like lights released into the night by strangers.
 */
export function FloatingLanterns() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    interface Lantern {
      x: number;
      y: number;
      size: number;
      hue: number;       // 0–360
      opacity: number;
      vx: number;
      vy: number;
      wobble: number;    // horizontal sway offset
      wobbleSpeed: number;
      wobbleAmp: number;
      glowPulse: number;
      glowSpeed: number;
    }

    const lanterns: Lantern[] = [];
    const MAX = 24;

    const spawn = () => {
      const hue = [0, 30, 280, 200][Math.floor(Math.random() * 4)]; // rose, amber, violet, sky
      lanterns.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 40,
        size: 8 + Math.random() * 14,
        hue,
        opacity: 0,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.4),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.008 + Math.random() * 0.008,
        wobbleAmp: 20 + Math.random() * 30,
        glowPulse: Math.random() * Math.PI * 2,
        glowSpeed: 0.02 + Math.random() * 0.02,
      });
    };

    // Seed initial lanterns spread across different heights
    for (let i = 0; i < MAX; i++) {
      spawn();
      const l = lanterns[i];
      l.y = Math.random() * canvas.height;
      l.opacity = 0.1 + Math.random() * 0.5;
    }

    // Spawn replacement lanterns periodically
    const spawnInterval = setInterval(() => {
      if (lanterns.length < MAX) spawn();
    }, 1800);

    let animFrame: number;

    const drawLantern = (l: Lantern) => {
      const glow = 0.5 + Math.sin(l.glowPulse) * 0.5;
      const r = l.size;

      // Outer glow
      const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r * 3.5);
      grad.addColorStop(0, `hsla(${l.hue}, 80%, 65%, ${l.opacity * glow * 0.35})`);
      grad.addColorStop(1, `hsla(${l.hue}, 80%, 65%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, r * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Lantern body — rounded rectangle
      const w = r * 1.2;
      const h = r * 1.6;
      const rx = w * 0.4;

      ctx.save();
      ctx.globalAlpha = l.opacity;

      // Body gradient (brighter centre)
      const bodyGrad = ctx.createLinearGradient(l.x - w / 2, l.y - h / 2, l.x + w / 2, l.y + h / 2);
      bodyGrad.addColorStop(0, `hsla(${l.hue}, 70%, 70%, 0.9)`);
      bodyGrad.addColorStop(0.5, `hsla(${l.hue}, 90%, 85%, 1)`);
      bodyGrad.addColorStop(1, `hsla(${l.hue}, 60%, 55%, 0.8)`);

      ctx.beginPath();
      ctx.roundRect(l.x - w / 2, l.y - h / 2, w, h, rx);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Inner flame glow
      const flameGrad = ctx.createRadialGradient(l.x, l.y + h * 0.1, 0, l.x, l.y, r * 0.8);
      flameGrad.addColorStop(0, `hsla(${l.hue + 20}, 100%, 90%, ${0.6 * glow})`);
      flameGrad.addColorStop(1, `hsla(${l.hue}, 80%, 65%, 0)`);
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.roundRect(l.x - w / 2, l.y - h / 2, w, h, rx);
      ctx.fill();

      // Top & bottom cap bars
      ctx.fillStyle = `hsla(${l.hue}, 60%, 50%, 0.9)`;
      ctx.fillRect(l.x - w * 0.5, l.y - h / 2, w, r * 0.22);
      ctx.fillRect(l.x - w * 0.5, l.y + h / 2 - r * 0.22, w, r * 0.22);

      // Hanging thread
      ctx.strokeStyle = `hsla(${l.hue}, 40%, 60%, 0.6)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - h / 2);
      ctx.lineTo(l.x, l.y - h / 2 - r * 1.2);
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = lanterns.length - 1; i >= 0; i--) {
        const l = lanterns[i];

        // Fade in
        if (l.opacity < 0.6) l.opacity = Math.min(0.6, l.opacity + 0.003);

        // Move
        l.wobble += l.wobbleSpeed;
        l.glowPulse += l.glowSpeed;
        l.x += l.vx + Math.sin(l.wobble) * 0.4;
        l.y += l.vy;

        // Fade out near top, then remove
        if (l.y < canvas.height * 0.15) l.opacity -= 0.004;
        if (l.opacity <= 0 || l.y < -60) {
          lanterns.splice(i, 1);
        } else {
          drawLantern(l);
        }
      }

      // Static background stars
      // (drawn once at low opacity so the sky doesn't feel empty)
      animFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrame);
      clearInterval(spawnInterval);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
