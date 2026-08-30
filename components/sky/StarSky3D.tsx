'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Star } from '@/types';

interface StarSky3DProps {
  stars: Star[];
  onStarClick: (star: Star) => void;
}

interface Star3D extends Star {
  x3d: number;
  y3d: number;
  z3d: number;
  screenX?: number;
  screenY?: number;
  scale?: number;
}

export function StarSky3D({ stars, onStarClick }: StarSky3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });
  const rotationRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(15000); // Start at maximum zoom out
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const stars3D = useRef<Star3D[]>([]);

  // Initialize 3D positions
  useEffect(() => {
    stars3D.current = stars.map((star) => {
      // Distribute stars in 3D sphere
      const theta = star.x * Math.PI * 2; // Horizontal angle
      const phi = star.y * Math.PI; // Vertical angle
      const radius = 300 + Math.random() * 200; // Distance from center

      return {
        ...star,
        x3d: radius * Math.sin(phi) * Math.cos(theta),
        y3d: radius * Math.cos(phi),
        z3d: radius * Math.sin(phi) * Math.sin(theta),
      };
    });
  }, [stars]);

  // Handle window resize
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

  // Animation loop
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

      // Project and sort stars by depth
      const rotation = rotationRef.current;
      const zoom = zoomRef.current;

      const projectedStars = stars3D.current.map((star) => {
        // Rotate the world
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);

        // Rotate around Y axis (horizontal drag)
        let x = star.x3d * cosY + star.z3d * sinY;
        let z = -star.x3d * sinY + star.z3d * cosY;
        let y = star.y3d;

        // Rotate around X axis (vertical drag)
        let y2 = y * cosX - z * sinX;
        let z2 = y * sinX + z * cosX;

        // Apply zoom (distance from viewer)
        z2 -= zoom;

        // Perspective projection
        const scale = 500 / (500 + z2);
        const screenX = canvas.width / 2 + x * scale;
        const screenY = canvas.height / 2 + y2 * scale;

        return {
          ...star,
          screenX,
          screenY,
          scale,
          depth: z2,
        };
      });

      // Sort by depth (furthest first)
      projectedStars.sort((a, b) => a.depth - b.depth);

      // Draw stars
      projectedStars.forEach((star) => {
        if (star.depth < -500 || star.scale < 0 || star.scale < 0.3) return; // Behind camera or too far

        const x = star.screenX!;
        const y = star.screenY!;
        const scale = star.scale!;

        // Skip if off screen
        if (x < -50 || x > canvas.width + 50 || y < -50 || y > canvas.height + 50) return;

        // Simplified rendering - no twinkle for performance
        const baseSize = 3;
        const size = hoveredStar?.id === star.id ? baseSize * 2 : baseSize;
        const finalSize = size * scale;

        // Simplified glow effect
        const glowSize = finalSize * 4;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, star.color + 'ff');
        gradient.addColorStop(0.5, star.color + '40');
        gradient.addColorStop(1, star.color + '00');

        ctx.globalAlpha = scale;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(x, y, finalSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Store for interaction
      stars3D.current = projectedStars;

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [stars, dimensions, hoveredStar]);

  // Mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;

      const rotation = rotationRef.current;
      rotation.y += deltaX * 0.005;
      rotation.x += deltaY * 0.005;

      setLastMouse({ x: e.clientX, y: e.clientY });
    } else {
      // Check for hover
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hovered = stars3D.current.find((star) => {
        if (!star.screenX || !star.screenY || !star.scale) return false;
        const distance = Math.sqrt(
          Math.pow(star.screenX - mouseX, 2) + Math.pow(star.screenY - mouseY, 2)
        );
        return distance < 20 * star.scale;
      });

      setHoveredStar(hovered || null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedStar = stars3D.current.find((star) => {
      if (!star.screenX || !star.screenY || !star.scale) return false;
      const distance = Math.sqrt(
        Math.pow(star.screenX - clickX, 2) + Math.pow(star.screenY - clickY, 2)
      );
      return distance < 20 * star.scale;
    });

    if (clickedStar) {
      onStarClick(clickedStar);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoom = zoomRef.current;
    // Zoom in/out based on wheel delta - much faster increment
    zoomRef.current = Math.max(50, Math.min(15000, zoom + e.deltaY * 10));
  };

  return (
    <div className="fixed inset-0">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Controls UI */}
      <div className="fixed bottom-8 left-8 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4 text-xs text-gray-400 space-y-2">
        <div className="font-medium text-white mb-2">Controls</div>
        <div><span className="text-star-gold">Drag</span> - Rotate view</div>
        <div><span className="text-star-gold">Scroll</span> - Zoom in/out</div>
        <div><span className="text-star-gold">Click</span> - Select star</div>
      </div>

      {/* Hover tooltip */}
      {hoveredStar && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="bg-black/80 backdrop-blur-md border border-white/30 rounded-lg px-4 py-2 text-sm">
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
