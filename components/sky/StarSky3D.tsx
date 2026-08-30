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
  const rotationRef = useRef({ x: Math.PI, y: 0 }); // Start right-side up
  const zoomRef = useRef(1000); // Start at a good middle view
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const stars3D = useRef<Star3D[]>([]);

  // Draw 3D grid planes
  const drawGridPlanes = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const rotation = rotationRef.current;
    const zoom = zoomRef.current;

    // Multiple grid levels with different spacings - extended ranges
    const gridLevels = [
      { spacing: 10, minZoom: 0, maxZoom: 100 },
      { spacing: 25, minZoom: 0, maxZoom: 200 },
      { spacing: 50, minZoom: 0, maxZoom: 400 },
      { spacing: 100, minZoom: 300, maxZoom: 800 },
      { spacing: 200, minZoom: 700, maxZoom: 1500 },
      { spacing: 500, minZoom: 1400, maxZoom: 3000 },
      { spacing: 1000, minZoom: 2800, maxZoom: 6000 },
      { spacing: 2000, minZoom: 5500, maxZoom: 12000 },
      { spacing: 5000, minZoom: 11000, maxZoom: 999999 },
    ];

    // Helper to project 3D point to 2D
    const project = (x3d: number, y3d: number, z3d: number) => {
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);

      let x = x3d * cosY + z3d * sinY;
      let z = -x3d * sinY + z3d * cosY;
      let y = y3d;

      let y2 = y * cosX - z * sinX;
      let z2 = y * sinX + z * cosX;
      z2 += zoom;

      const scale = 500 / (500 + z2);
      const screenX = width / 2 + x * scale;
      const screenY = height / 2 + y2 * scale;

      return { screenX, screenY, scale, z2 };
    };

    // Draw a line with clipping at camera plane
    const drawLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      const p1 = project(x1, y1, z1);
      const p2 = project(x2, y2, z2);

      // Near plane - clip anything too close to avoid extreme projections
      const nearZ = -400;

      // Both points behind camera - don't draw
      if (p1.z2 < nearZ && p2.z2 < nearZ) {
        return;
      }

      // Both points in front - draw normally
      if (p1.z2 >= nearZ && p2.z2 >= nearZ) {
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.stroke();
        return;
      }

      // One point behind, one in front - clip to near plane
      let t = 0;
      if (p1.z2 < nearZ) {
        t = (nearZ - p1.z2) / (p2.z2 - p1.z2);
        const clippedX = x1 + t * (x2 - x1);
        const clippedY = y1 + t * (y2 - y1);
        const clippedZ = z1 + t * (z2 - z1);
        const pClipped = project(clippedX, clippedY, clippedZ);

        ctx.beginPath();
        ctx.moveTo(pClipped.screenX, pClipped.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.stroke();
      } else {
        t = (nearZ - p1.z2) / (p2.z2 - p1.z2);
        const clippedX = x1 + t * (x2 - x1);
        const clippedY = y1 + t * (y2 - y1);
        const clippedZ = z1 + t * (z2 - z1);
        const pClipped = project(clippedX, clippedY, clippedZ);

        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(pClipped.screenX, pClipped.screenY);
        ctx.stroke();
      }
    };

    // Draw a grid plane with given spacing and opacity
    const drawGridLevel = (spacing: number, opacity: number) => {
      // Calculate grid range - much larger to appear infinite
      const maxCoord = 50000;
      const numLines = Math.floor(maxCoord / spacing);

      // Draw XY plane (z=0) - blue
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * opacity})`;
      ctx.lineWidth = 1;
      for (let i = -numLines; i <= numLines; i++) {
        const offset = i * spacing;

        // Lines parallel to X axis
        drawLine(-maxCoord, offset, 0, maxCoord, offset, 0);

        // Lines parallel to Y axis
        drawLine(offset, -maxCoord, 0, offset, maxCoord, 0);
      }

      // Draw XZ plane (y=0) - green
      ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 * opacity})`;
      for (let i = -numLines; i <= numLines; i++) {
        const offset = i * spacing;

        // Lines parallel to X axis
        drawLine(-maxCoord, 0, offset, maxCoord, 0, offset);

        // Lines parallel to Z axis
        drawLine(offset, 0, -maxCoord, offset, 0, maxCoord);
      }

      // Draw YZ plane (x=0) - red
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.2 * opacity})`;
      for (let i = -numLines; i <= numLines; i++) {
        const offset = i * spacing;

        // Lines parallel to Y axis
        drawLine(0, -maxCoord, offset, 0, maxCoord, offset);

        // Lines parallel to Z axis
        drawLine(0, offset, -maxCoord, 0, offset, maxCoord);
      }
    };

    // Draw all active grid levels with fade transitions
    gridLevels.forEach(level => {
      let opacity = 0;

      // Fade in
      if (zoom >= level.minZoom && zoom <= level.minZoom + 100) {
        opacity = (zoom - level.minZoom) / 100;
      }
      // Fully visible
      else if (zoom > level.minZoom + 100 && zoom < level.maxZoom - 100) {
        opacity = 1;
      }
      // Fade out
      else if (zoom >= level.maxZoom - 100 && zoom <= level.maxZoom) {
        opacity = (level.maxZoom - zoom) / 100;
      }

      if (opacity > 0.01) {
        drawGridLevel(level.spacing, opacity);
      }
    });
  };

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

      // Draw grid planes
      drawGridPlanes(ctx, canvas.width, canvas.height);

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
        z2 += zoom;

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
        if (star.depth < -500 || star.scale < 0 || star.scale < 0.01) return; // Behind camera or too far

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
    const newZoom = Math.max(0, Math.min(10000, zoom + e.deltaY * 5));
    console.log('Wheel event:', { oldZoom: zoom, deltaY: e.deltaY, newZoom });
    zoomRef.current = newZoom;
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
