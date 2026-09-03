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
  hoverSize?: number; // Current animated hover size
  targetHoverSize?: number; // Target hover size for easing
}

export function StarSky3D({ stars, onStarClick }: StarSky3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });
  const rotationRef = useRef({ x: Math.PI, y: 0 }); // Start right-side up
  const targetRotationRef = useRef({ x: Math.PI, y: 0 }); // Target rotation for smooth interpolation
  const zoomRef = useRef(1000); // Start at a good middle view
  const targetZoomRef = useRef(1000); // Target zoom for smooth interpolation
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const stars3D = useRef<Star3D[]>([]);
  const glowRotationRef = useRef(0); // Rotation angle for 4-corner glow effect

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

    // Debug: check which levels are active
    const activeLevels = gridLevels.filter(level => {
      if (zoom >= level.minZoom && zoom <= level.minZoom + 100) return true;
      if (zoom > level.minZoom + 100 && zoom < level.maxZoom - 100) return true;
      if (zoom >= level.maxZoom - 100 && zoom <= level.maxZoom) return true;
      return false;
    });

    if (activeLevels.length === 0) {
      console.log('NO ACTIVE GRID LEVELS at zoom:', zoom);
    }

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
      // Procedurally calculate which lines are visible based on camera position and zoom
      // Instead of drawing all lines from -maxCoord to +maxCoord, only draw lines near the visible area

      // Calculate approximate visible range in world space
      // The visible range depends on zoom and screen dimensions
      // Add a minimum to ensure grids are visible even at zoom = 0
      const visibleRange = Math.max(500, zoom * 5); // Approximate world-space units visible

      // Debug at zoom 0
      if (zoom === 0) {
        console.log('drawGridLevel called at zoom 0:', { spacing, opacity, visibleRange, zoom });
      }

      // For each plane, calculate the center of the visible region
      // For simplicity, assume camera is looking at origin after rotation
      const gridOrigin = 0;

      // Calculate which grid lines to draw (only those near the visible area)
      const minLine = Math.floor((gridOrigin - visibleRange) / spacing);
      const maxLine = Math.ceil((gridOrigin + visibleRange) / spacing);

      if (zoom === 0) {
        console.log('Grid lines range:', { minLine, maxLine, numLines: maxLine - minLine });
      }

      // Draw XY plane (z=0) - blue
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * opacity})`;
      ctx.lineWidth = 0.5;
      for (let i = minLine; i <= maxLine; i++) {
        const offset = i * spacing;

        // Lines parallel to X axis
        drawLine(-visibleRange * 2, offset, 0, visibleRange * 2, offset, 0);

        // Lines parallel to Y axis
        drawLine(offset, -visibleRange * 2, 0, offset, visibleRange * 2, 0);
      }

      // Draw XZ plane (y=0) - green
      ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 * opacity})`;
      ctx.lineWidth = 0.5;
      for (let i = minLine; i <= maxLine; i++) {
        const offset = i * spacing;

        // Lines parallel to X axis
        drawLine(-visibleRange * 2, 0, offset, visibleRange * 2, 0, offset);

        // Lines parallel to Z axis
        drawLine(offset, 0, -visibleRange * 2, offset, 0, visibleRange * 2);
      }

      // Draw YZ plane (x=0) - red
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.2 * opacity})`;
      ctx.lineWidth = 0.5;
      for (let i = minLine; i <= maxLine; i++) {
        const offset = i * spacing;

        // Lines parallel to Y axis
        drawLine(0, -visibleRange * 2, offset, 0, visibleRange * 2, offset);

        // Lines parallel to Z axis
        drawLine(0, offset, -visibleRange * 2, 0, offset, visibleRange * 2);
      }
    };

    // Draw all active grid levels with fade transitions
    gridLevels.forEach(level => {
      let opacity = 0;

      // Fade in range
      const fadeInEnd = level.minZoom + 100;
      // Fade out range
      const fadeOutStart = level.maxZoom - 100;

      // Fade in
      if (zoom >= level.minZoom && zoom <= fadeInEnd) {
        opacity = Math.min(1, (zoom - level.minZoom + 10) / 100); // +10 to give 0.1 opacity at minZoom
      }
      // Fully visible
      else if (zoom > fadeInEnd && zoom < fadeOutStart) {
        opacity = 1;
      }
      // Fade out
      else if (zoom >= fadeOutStart && zoom <= level.maxZoom) {
        opacity = (level.maxZoom - zoom + 10) / 100; // +10 to avoid hitting 0
      }

      if (opacity >= 0.05) {  // Changed from > to >= and raised threshold
        drawGridLevel(level.spacing, opacity);
      }
    });
  };

  // Seeded random number generator for deterministic positions
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Initialize 3D positions
  useEffect(() => {
    stars3D.current = stars.map((star) => {
      // Use star ID/timestamp as seed for deterministic random
      const seed = (star as any).timestamp || 0;

      // Distribute stars in 3D sphere
      const theta = star.x * Math.PI * 2; // Horizontal angle
      const phi = star.y * Math.PI; // Vertical angle
      const radius = 300 + seededRandom(seed) * 200; // Deterministic distance from center

      return {
        ...star,
        x3d: radius * Math.sin(phi) * Math.cos(theta),
        y3d: radius * Math.cos(phi),
        z3d: radius * Math.sin(phi) * Math.sin(theta),
        hoverSize: 1, // Start at normal size
        targetHoverSize: 1,
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

      // Smooth interpolation for rotation (easing)
      const rotationEasing = 0.1; // Lower = smoother but slower
      const rotation = rotationRef.current;
      const targetRotation = targetRotationRef.current;
      rotation.x += (targetRotation.x - rotation.x) * rotationEasing;
      rotation.y += (targetRotation.y - rotation.y) * rotationEasing;

      // Smooth interpolation for zoom
      const zoomEasing = 0.15; // Lower = smoother but slower
      const zoom = zoomRef.current;
      const targetZoom = targetZoomRef.current;
      zoomRef.current += (targetZoom - zoom) * zoomEasing;

      // Rotate glow effect (slower)
      glowRotationRef.current += 0.02;

      // Update hover sizes with easing
      stars3D.current.forEach((star) => {
        // Set target hover size based on whether this star is hovered
        if (hoveredStar?.id === star.id) {
          star.targetHoverSize = 2.5;
        } else {
          star.targetHoverSize = 1;
        }

        // Ease current size towards target
        const hoverEasing = 0.15;
        star.hoverSize = star.hoverSize || 1;
        star.hoverSize += (star.targetHoverSize! - star.hoverSize) * hoverEasing;
      });

      // Fill with pitch black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid planes
      drawGridPlanes(ctx, canvas.width, canvas.height);

      // Project and sort stars by depth
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

        // Star size scales with journal size
        // 0 entries = size 2, 10 = 3.5, 50 = 5, 100+ = 7 (logarithmic)
        const entryCount = (star as any).entry_count || 0;
        const baseSize = 2 + Math.min(5, Math.log2(entryCount + 1) * 1.5);
        const hoverMultiplier = star.hoverSize || 1;
        const size = baseSize * hoverMultiplier;
        const finalSize = size * scale;

        // 4-pointed star sparkle effect for hovered star
        if (hoveredStar?.id === star.id && hoverMultiplier > 1.2) {
          const sparkleAngle = glowRotationRef.current;
          const sparkleLength = finalSize * 2.5 * (hoverMultiplier - 1);
          const sparkleLength2 = finalSize * 2 * (hoverMultiplier - 1); // Smaller second star

          // Helper function to make color whiter
          const whitenColor = (hexColor: string) => {
            // Parse hex color (assuming format like #RRGGBB)
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);

            // Add 100 to each channel and cap at 255
            const wr = Math.min(255, r + 100);
            const wg = Math.min(255, g + 100);
            const wb = Math.min(255, b + 100);

            return `#${wr.toString(16).padStart(2, '0')}${wg.toString(16).padStart(2, '0')}${wb.toString(16).padStart(2, '0')}`;
          };

          const whiteColor = whitenColor(star.color);

          ctx.globalAlpha = scale * 0.6 * (hoverMultiplier - 1);

          // Draw first set of 4 diamond-shaped rays (original angle)
          for (let i = 0; i < 4; i++) {
            const angle = sparkleAngle + (i * Math.PI / 2);

            // Create a gradient along the ray direction
            const rayEndX = x + Math.cos(angle) * sparkleLength;
            const rayEndY = y + Math.sin(angle) * sparkleLength;

            const rayGradient = ctx.createLinearGradient(x, y, rayEndX, rayEndY);
            rayGradient.addColorStop(0, star.color + 'ff');
            rayGradient.addColorStop(0.3, star.color + 'aa');
            rayGradient.addColorStop(1, star.color + '00');

            ctx.fillStyle = rayGradient;

            // Draw diamond-shaped ray
            ctx.beginPath();
            ctx.moveTo(x, y); // Center

            // Calculate perpendicular offset for width
            const perpAngle = angle + Math.PI / 2;
            const width = sparkleLength * 0.15;

            // One side of the ray
            const midX = x + Math.cos(angle) * sparkleLength * 0.4;
            const midY = y + Math.sin(angle) * sparkleLength * 0.4;

            ctx.lineTo(
              midX + Math.cos(perpAngle) * width,
              midY + Math.sin(perpAngle) * width
            );
            ctx.lineTo(rayEndX, rayEndY); // Tip
            ctx.lineTo(
              midX - Math.cos(perpAngle) * width,
              midY - Math.sin(perpAngle) * width
            );

            ctx.closePath();
            ctx.fill();
          }

          // Draw second set of 4 diamond-shaped rays (rotated 45 degrees, whiter and smaller)
          for (let i = 0; i < 4; i++) {
            const angle = sparkleAngle + (i * Math.PI / 2) + (Math.PI / 4); // +45 degrees

            // Create a gradient along the ray direction
            const rayEndX = x + Math.cos(angle) * sparkleLength2;
            const rayEndY = y + Math.sin(angle) * sparkleLength2;

            const rayGradient = ctx.createLinearGradient(x, y, rayEndX, rayEndY);
            rayGradient.addColorStop(0, whiteColor + 'ff');
            rayGradient.addColorStop(0.3, whiteColor + 'aa');
            rayGradient.addColorStop(1, whiteColor + '00');

            ctx.fillStyle = rayGradient;

            // Draw diamond-shaped ray
            ctx.beginPath();
            ctx.moveTo(x, y); // Center

            // Calculate perpendicular offset for width
            const perpAngle = angle + Math.PI / 2;
            const width = sparkleLength2 * 0.15;

            // One side of the ray
            const midX = x + Math.cos(angle) * sparkleLength2 * 0.4;
            const midY = y + Math.sin(angle) * sparkleLength2 * 0.4;

            ctx.lineTo(
              midX + Math.cos(perpAngle) * width,
              midY + Math.sin(perpAngle) * width
            );
            ctx.lineTo(rayEndX, rayEndY); // Tip
            ctx.lineTo(
              midX - Math.cos(perpAngle) * width,
              midY - Math.sin(perpAngle) * width
            );

            ctx.closePath();
            ctx.fill();
          }
        }

        // Main glow effect
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

      const targetRotation = targetRotationRef.current;
      targetRotation.y += deltaX * 0.005;
      targetRotation.x += deltaY * 0.005;

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
    const targetZoom = targetZoomRef.current;
    const newZoom = Math.max(0, Math.min(10000, targetZoom + e.deltaY * 5));
    targetZoomRef.current = newZoom;
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
