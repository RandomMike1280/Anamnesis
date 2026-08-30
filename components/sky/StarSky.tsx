'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Star } from '@/types';

interface StarSkyProps {
  stars: Star[];
  onStarClick: (star: Star) => void;
}

export function StarSky({ stars, onStarClick }: StarSkyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach((star) => {
        const x = star.x * canvas.width;
        const y = star.y * canvas.height;

        // Twinkle effect
        const twinkle = Math.sin(time + star.x * 10) * 0.3 + 0.7;
        const size = hoveredStar?.id === star.id ? 6 : 4;

        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
        gradient.addColorStop(0, star.color + 'ff');
        gradient.addColorStop(0.5, star.color + '80');
        gradient.addColorStop(1, star.color + '00');

        ctx.globalAlpha = twinkle;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [stars, dimensions, hoveredStar]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Find clicked star
    const clickedStar = stars.find((star) => {
      const distance = Math.sqrt(
        Math.pow(star.x - clickX, 2) + Math.pow(star.y - clickY, 2)
      );
      return distance < 0.02; // Click radius
    });

    if (clickedStar) {
      onStarClick(clickedStar);
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    // Find hovered star
    const hovered = stars.find((star) => {
      const distance = Math.sqrt(
        Math.pow(star.x - mouseX, 2) + Math.pow(star.y - mouseY, 2)
      );
      return distance < 0.02;
    });

    setHoveredStar(hovered || null);
  };

  return (
    <div className="fixed inset-0">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        className="cursor-crosshair"
      />

      {/* Hover tooltip */}
      {hoveredStar && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-sm">
            <p className="font-medium">{hoveredStar.username || 'Anonymous'}</p>
            {hoveredStar.region && (
              <p className="text-xs text-gray-400">{hoveredStar.region}</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
