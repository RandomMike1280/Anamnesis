'use client';

import { useEffect, useRef } from 'react';

interface StarSparkleProps {
  color: string;
  size?: number;
}

export function StarSparkle({ color, size = 80 }: StarSparkleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size * 2;
    canvas.height = size * 2;

    let animationFrame: number;

    // Helper function to make color whiter
    const whitenColor = (hexColor: string) => {
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      const wr = Math.min(255, r + 100);
      const wg = Math.min(255, g + 100);
      const wb = Math.min(255, b + 100);

      return `#${wr.toString(16).padStart(2, '0')}${wg.toString(16).padStart(2, '0')}${wb.toString(16).padStart(2, '0')}`;
    };

    const whiteColor = whitenColor(color);

    const animate = () => {
      rotationRef.current += 0.02;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const sparkleLength = size * 0.8; // Increased from 0.5
      const sparkleLength2 = size * 0.6; // Increased from 0.4

      // Draw first set of 4 rays
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 4; i++) {
        const angle = rotationRef.current + (i * Math.PI / 2);

        const rayEndX = centerX + Math.cos(angle) * sparkleLength;
        const rayEndY = centerY + Math.sin(angle) * sparkleLength;

        const rayGradient = ctx.createLinearGradient(centerX, centerY, rayEndX, rayEndY);
        rayGradient.addColorStop(0, color + 'ff');
        rayGradient.addColorStop(0.3, color + 'aa');
        rayGradient.addColorStop(1, color + '00');

        ctx.fillStyle = rayGradient;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);

        const perpAngle = angle + Math.PI / 2;
        const width = sparkleLength * 0.15;

        const midX = centerX + Math.cos(angle) * sparkleLength * 0.4;
        const midY = centerY + Math.sin(angle) * sparkleLength * 0.4;

        ctx.lineTo(
          midX + Math.cos(perpAngle) * width,
          midY + Math.sin(perpAngle) * width
        );
        ctx.lineTo(rayEndX, rayEndY);
        ctx.lineTo(
          midX - Math.cos(perpAngle) * width,
          midY - Math.sin(perpAngle) * width
        );

        ctx.closePath();
        ctx.fill();
      }

      // Draw second set of 4 rays (rotated 45 degrees, whiter and smaller)
      for (let i = 0; i < 4; i++) {
        const angle = rotationRef.current + (i * Math.PI / 2) + (Math.PI / 4);

        const rayEndX = centerX + Math.cos(angle) * sparkleLength2;
        const rayEndY = centerY + Math.sin(angle) * sparkleLength2;

        const rayGradient = ctx.createLinearGradient(centerX, centerY, rayEndX, rayEndY);
        rayGradient.addColorStop(0, whiteColor + 'ff');
        rayGradient.addColorStop(0.3, whiteColor + 'aa');
        rayGradient.addColorStop(1, whiteColor + '00');

        ctx.fillStyle = rayGradient;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);

        const perpAngle = angle + Math.PI / 2;
        const width = sparkleLength2 * 0.15;

        const midX = centerX + Math.cos(angle) * sparkleLength2 * 0.4;
        const midY = centerY + Math.sin(angle) * sparkleLength2 * 0.4;

        ctx.lineTo(
          midX + Math.cos(perpAngle) * width,
          midY + Math.sin(perpAngle) * width
        );
        ctx.lineTo(rayEndX, rayEndY);
        ctx.lineTo(
          midX - Math.cos(perpAngle) * width,
          midY - Math.sin(perpAngle) * width
        );

        ctx.closePath();
        ctx.fill();
      }

      // Draw center circle with glow (slightly larger)
      const coreSize = size * 0.15; // Increased from 0.12
      const glowSize = size * 0.25; // Increased from 0.2
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
      gradient.addColorStop(0, color + 'ff');
      gradient.addColorStop(0.5, color + '80');
      gradient.addColorStop(1, color + '00');

      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Center core
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fill();

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [color, size]);

  return <canvas ref={canvasRef} className="absolute inset-0 m-auto" />;
}
