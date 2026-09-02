'use client';

import { useEffect, useRef } from 'react';

/**
 * Real aurora borealis simulation.
 * Key traits from photographs:
 *  - Vertical curtain-like rays/columns rising from a horizon band
 *  - Dominant green (oxygen at ~100km), with magenta/red crowns at the tops
 *  - Rays undulate horizontally in slow waves — not sinusoidal hills
 *  - Brightness pulses independently per column
 *  - Stars visible through the curtain
 */
export function AuroraWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Stars ────────────────────────────────────────────────────────────────
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.65, // only in the upper sky
      r: Math.random() * 1.2 + 0.2,
      a: Math.random() * 0.5 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.01 + Math.random() * 0.02,
    }));

    // ── Aurora ray columns ───────────────────────────────────────────────────
    // Each ray is a vertical column with:
    //   baseX   – normalised x position (0–1)
    //   width   – column width
    //   height  – how tall the ray reaches (normalised, 0 = full height)
    //   phase   – undulation phase
    //   bright  – current brightness (0–1), pulses independently
    //   brightTarget
    interface Ray {
      baseX: number;
      xPhase: number;      // slow horizontal drift phase
      xAmp: number;        // how much it drifts left/right
      width: number;
      heightFrac: number;  // fraction of canvas height the ray occupies
      bright: number;
      brightTarget: number;
      brightSpeed: number;
      pulsePhase: number;
      pulseSpeed: number;
    }

    const NUM_RAYS = 28;
    const rays: Ray[] = Array.from({ length: NUM_RAYS }, (_, i) => ({
      baseX: (i + 0.5) / NUM_RAYS + (Math.random() - 0.5) * 0.02,
      xPhase: Math.random() * Math.PI * 2,
      xAmp: 0.01 + Math.random() * 0.025,
      width: 0.025 + Math.random() * 0.04,
      heightFrac: 0.35 + Math.random() * 0.45,
      bright: Math.random(),
      brightTarget: Math.random(),
      brightSpeed: 0.003 + Math.random() * 0.006,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.01,
    }));

    // Horizon base band position (normalised from top)
    const HORIZON = 0.72;

    // Global slow undulation — shifts all rays together slightly
    let globalPhase = 0;

    let animFrame: number;
    let t = 0;

    const drawRay = (ray: Ray) => {
      const W = canvas.width;
      const H = canvas.height;

      // Current x with slow drift
      const cx = (ray.baseX + Math.sin(ray.xPhase + globalPhase * 0.4) * ray.xAmp) * W;
      const halfW = ray.width * W * 0.5;

      // Ray top y (higher bright = taller ray)
      const topY = HORIZON * H - ray.heightFrac * H * (0.5 + ray.bright * 0.5);
      const bottomY = HORIZON * H + H * 0.04; // slightly below horizon

      // Pulse — makes the ray shimmer vertically
      const pulse = 0.7 + 0.3 * Math.sin(ray.pulsePhase);
      const alpha = ray.bright * pulse;

      if (alpha < 0.02) return;

      // ── Green curtain body ──
      const bodyGrad = ctx.createLinearGradient(cx, bottomY, cx, topY);
      bodyGrad.addColorStop(0,   `rgba(0, 255, 80,  ${alpha * 0.85})`);
      bodyGrad.addColorStop(0.4, `rgba(0, 230, 60,  ${alpha * 0.70})`);
      bodyGrad.addColorStop(0.75,`rgba(0, 200, 100, ${alpha * 0.45})`);
      bodyGrad.addColorStop(1,   `rgba(0, 180, 120, 0)`);

      // Horizontal gradient (bright centre, fades to edges)
      const leftGrad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      leftGrad.addColorStop(0, 'rgba(0,0,0,0)');
      leftGrad.addColorStop(0.35, 'rgba(255,255,255,1)');
      leftGrad.addColorStop(0.65, 'rgba(255,255,255,1)');
      leftGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();

      // Clip to the ray column shape
      ctx.beginPath();
      ctx.rect(cx - halfW * 1.8, topY, halfW * 3.6, bottomY - topY);
      ctx.clip();

      ctx.fillStyle = bodyGrad;
      ctx.globalAlpha = 1;
      ctx.fillRect(cx - halfW * 1.8, topY, halfW * 3.6, bottomY - topY);

      // ── Magenta / red crown at the top ──
      if (ray.bright > 0.35) {
        const crownH = (bottomY - topY) * 0.22;
        const crownGrad = ctx.createLinearGradient(cx, topY, cx, topY + crownH);
        crownGrad.addColorStop(0, `rgba(255, 30, 100, 0)`);
        crownGrad.addColorStop(0.5, `rgba(220, 20, 120, ${alpha * 0.5})`);
        crownGrad.addColorStop(1, `rgba(180, 40, 80, 0)`);
        ctx.fillStyle = crownGrad;
        ctx.fillRect(cx - halfW * 1.5, topY, halfW * 3, crownH);
      }

      ctx.restore();

      // ── Soft outer glow halo ──
      ctx.save();
      const haloGrad = ctx.createRadialGradient(cx, (topY + bottomY) * 0.5, 0, cx, (topY + bottomY) * 0.5, halfW * 3.5);
      haloGrad.addColorStop(0, `rgba(0, 255, 100, ${alpha * 0.12})`);
      haloGrad.addColorStop(1, 'rgba(0,255,100,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.ellipse(cx, (topY + bottomY) * 0.55, halfW * 3.5, (bottomY - topY) * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawHorizonGlow = () => {
      const W = canvas.width;
      const H = canvas.height;
      const y = HORIZON * H;

      // Green horizon band — the base of the aurora curtain
      const grad = ctx.createLinearGradient(0, y - H * 0.08, 0, y + H * 0.06);
      grad.addColorStop(0, 'rgba(0, 255, 80, 0)');
      grad.addColorStop(0.4, 'rgba(0, 200, 60, 0.18)');
      grad.addColorStop(0.7, 'rgba(0, 160, 40, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, y - H * 0.08, W, H * 0.14);
    };

    const animate = () => {
      t += 1;
      globalPhase += 0.004;

      const W = canvas.width;
      const H = canvas.height;

      // Deep space sky — slight blue-black gradient top to bottom
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#000000');
      skyGrad.addColorStop(0.6, '#020508');
      skyGrad.addColorStop(1, '#000000');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach((s) => {
        s.twinkle += s.twinkleSpeed;
        const a = s.a * (0.7 + 0.3 * Math.sin(s.twinkle));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update ray brightness (slow independent pulses)
      rays.forEach((ray) => {
        ray.xPhase += 0.003;
        ray.pulsePhase += ray.pulseSpeed;
        // Drift brightness toward target
        ray.bright += (ray.brightTarget - ray.bright) * ray.brightSpeed;
        // Occasionally pick a new target
        if (Math.abs(ray.bright - ray.brightTarget) < 0.02) {
          ray.brightTarget = 0.1 + Math.random() * 0.9;
        }
      });

      // Draw horizon glow first (behind rays)
      drawHorizonGlow();

      // Draw rays back-to-front (dimmest first)
      const sorted = [...rays].sort((a, b) => a.bright - b.bright);
      sorted.forEach(drawRay);

      animFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
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
