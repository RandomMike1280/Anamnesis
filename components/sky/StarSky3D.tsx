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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, z: -500, rotX: 0, rotY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const keysPressed = useRef<Set<string>>(new Set());
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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

      // Update camera based on keyboard input
      const moveSpeed = 5;
      const rotSpeed = 0.02;

      if (keysPressed.current.has('w')) camera.z += moveSpeed;
      if (keysPressed.current.has('s')) camera.z -= moveSpeed;
      if (keysPressed.current.has('a')) camera.x -= moveSpeed;
      if (keysPressed.current.has('d')) camera.x += moveSpeed;
      if (keysPressed.current.has('q')) camera.y -= moveSpeed;
      if (keysPressed.current.has('e')) camera.y += moveSpeed;
      if (keysPressed.current.has('arrowleft')) camera.rotY -= rotSpeed;
      if (keysPressed.current.has('arrowright')) camera.rotY += rotSpeed;
      if (keysPressed.current.has('arrowup')) camera.rotX -= rotSpeed;
      if (keysPressed.current.has('arrowdown')) camera.rotX += rotSpeed;

      setCamera({ ...camera });

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Project and sort stars by depth
      const projectedStars = stars3D.current.map((star) => {
        // Apply camera rotation
        const cosY = Math.cos(camera.rotY);
        const sinY = Math.sin(camera.rotY);
        const cosX = Math.cos(camera.rotX);
        const sinX = Math.sin(camera.rotX);

        // Rotate around Y axis
        let x = star.x3d * cosY + star.z3d * sinY;
        let z = -star.x3d * sinY + star.z3d * cosY;
        let y = star.y3d;

        // Rotate around X axis
        const y2 = y * cosX - z * sinX;
        const z2 = y * sinX + z * cosX;

        // Apply camera position
        x -= camera.x;
        y = y2 - camera.y;
        z = z2 - camera.z;

        // Perspective projection
        const fov = 500;
        const scale = fov / (fov + z);
        const screenX = canvas.width / 2 + x * scale;
        const screenY = canvas.height / 2 + y * scale;

        return {
          ...star,
          screenX,
          screenY,
          scale,
          depth: z,
        };
      });

      // Sort by depth (furthest first)
      projectedStars.sort((a, b) => a.depth - b.depth);

      // Draw stars
      projectedStars.forEach((star) => {
        if (star.depth < -fov || star.scale < 0) return; // Behind camera

        const x = star.screenX!;
        const y = star.screenY!;
        const scale = star.scale!;

        // Twinkle effect
        const twinkle = Math.sin(time + star.x * 10) * 0.3 + 0.7;
        const baseSize = 3;
        const size = hoveredStar?.id === star.id ? baseSize * 2 : baseSize;
        const finalSize = size * scale;

        // Glow effect
        const glowSize = finalSize * 6;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, star.color + 'ff');
        gradient.addColorStop(0.4, star.color + '60');
        gradient.addColorStop(1, star.color + '00');

        ctx.globalAlpha = twinkle * scale;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = 1 * scale;
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
  }, [stars, dimensions, camera, hoveredStar]);

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

      setCamera({
        ...camera,
        rotY: camera.rotY + deltaX * 0.005,
        rotX: camera.rotX + deltaY * 0.005,
      });

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

  return (
    <div className="fixed inset-0">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Controls UI */}
      <div className="fixed bottom-8 left-8 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4 text-xs text-gray-400 space-y-2">
        <div className="font-medium text-white mb-2">Controls</div>
        <div><span className="text-star-gold">WASD</span> - Move camera</div>
        <div><span className="text-star-gold">Q/E</span> - Up/Down</div>
        <div><span className="text-star-gold">Arrows</span> - Rotate view</div>
        <div><span className="text-star-gold">Drag</span> - Look around</div>
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
