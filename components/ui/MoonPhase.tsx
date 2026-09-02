'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface MoonPhaseProps {
  size?: number;
}

export function MoonPhase({ size = 400 }: MoonPhaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [moonImage, setMoonImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load the moon texture image
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg';
    img.onload = () => setMoonImage(img);
  }, []);

  useEffect(() => {
    if (!moonImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon again)
    const getMoonPhase = () => {
      const now = new Date();
      const newMoon = new Date('2000-01-06T18:14:00Z'); // Known new moon
      const lunarCycle = 29.53058867; // days
      const daysSinceNew = (now.getTime() - newMoon.getTime()) / (1000 * 60 * 60 * 24);
      const phase = (daysSinceNew % lunarCycle) / lunarCycle;
      return phase;
    };

    const drawMoon = () => {
      const phase = getMoonPhase();
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 10;

      // Clear canvas with black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);

      // Draw moon with clipping
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Draw the moon image
      ctx.drawImage(
        moonImage,
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
      );

      ctx.restore();

      // Draw shadow based on phase
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      if (phase < 0.5) {
        // Waxing (growing) - shadow on left
        const shadowWidth = radius * 2 * (1 - phase * 2);
        const shadowX = centerX - radius + shadowWidth / 2;

        ctx.beginPath();
        ctx.ellipse(
          shadowX,
          centerY,
          shadowWidth / 2,
          radius,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.98)';
        ctx.fill();
      } else {
        // Waning (shrinking) - shadow on right
        const shadowWidth = radius * 2 * ((phase - 0.5) * 2);
        const shadowX = centerX + radius - shadowWidth / 2;

        ctx.beginPath();
        ctx.ellipse(
          shadowX,
          centerY,
          shadowWidth / 2,
          radius,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.98)';
        ctx.fill();
      }

      ctx.restore();

      // Add subtle outer glow
      ctx.shadowColor = 'rgba(200, 200, 200, 0.15)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    drawMoon();
  }, [size, moonImage]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-full" />;
}
