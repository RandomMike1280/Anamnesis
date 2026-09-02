'use client';

import { useEffect, useRef } from 'react';

/**
 * Static starfield with subtle sparkles and occasional comet trails
 * More restful than rotating trails — suitable for pricing/informational pages
 */
export function StaticStarfield() {
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

    // Generate static stars — mix of dim ambient and a few bright ones that sparkle visibly
    const numStars = 180;
    const stars = Array.from({ length: numStars }, () => {
      const isBright = Math.random() < 0.25; // 25% are bright sparklers
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: isBright ? Math.random() * 1.8 + 1.0 : Math.random() * 1.0 + 0.2,
        baseBrightness: isBright ? 0.75 + Math.random() * 0.25 : 0.2 + Math.random() * 0.3,
        sparkleAmp: isBright ? 0.7 : 0.15, // bright stars swing a lot more
        sparklePhase: Math.random() * Math.PI * 2,
        sparkleSpeed: isBright
          ? 0.012 + Math.random() * 0.018 // faster cycle for bright ones
          : 0.003 + Math.random() * 0.006,
      };
    });

    // Comet trails
    interface Comet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      brightness: number;
      life: number;
    }

    const comets: Comet[] = [];
    const maxComets = 3;

    // Fixed angle: top-left to bottom-right diagonal (like a classic shooting star)
    const COMET_ANGLE = Math.PI / 4; // 45 degrees
    const COMET_SPEED = 4;

    const spawnComet = () => {
      if (comets.length >= maxComets) return;

      // All comets start from top edge, moving at the same angle
      const x = Math.random() * canvas.width;
      const y = -20;
      const vx = Math.cos(COMET_ANGLE) * COMET_SPEED;
      const vy = Math.sin(COMET_ANGLE) * COMET_SPEED;

      comets.push({
        x,
        y,
        vx,
        vy,
        length: 60 + Math.random() * 40,
        brightness: 1,
        life: 1,
      });
    };

    // Spawn comets randomly
    const cometInterval = setInterval(() => {
      if (Math.random() < 0.3) spawnComet();
    }, 3000);

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 1;

      // Clear with black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw static stars with sparkle
      stars.forEach((star) => {
        const sparkle = Math.sin(time * star.sparkleSpeed + star.sparklePhase);
        const brightness = Math.max(0, Math.min(1, star.baseBrightness + sparkle * star.sparkleAmp));

        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw and update comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const comet = comets[i];

        // Update position
        comet.x += comet.vx;
        comet.y += comet.vy;
        comet.life -= 0.004;

        // Remove if off-screen or faded
        if (
          comet.life <= 0 ||
          comet.x < -100 ||
          comet.x > canvas.width + 100 ||
          comet.y < -100 ||
          comet.y > canvas.height + 100
        ) {
          comets.splice(i, 1);
          continue;
        }

        // Draw trail
        const gradient = ctx.createLinearGradient(
          comet.x,
          comet.y,
          comet.x - comet.vx * comet.length,
          comet.y - comet.vy * comet.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${comet.life * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${comet.life * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(
          comet.x - comet.vx * comet.length,
          comet.y - comet.vy * comet.length
        );
        ctx.stroke();

        // Draw bright head
        ctx.fillStyle = `rgba(255, 255, 255, ${comet.life})`;
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(cometInterval);
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
