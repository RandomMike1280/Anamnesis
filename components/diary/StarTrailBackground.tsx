'use client';

import { useEffect, useRef } from 'react';

export function StarTrailBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastActivityRef = useRef(Date.now());
  const rotationSpeedRef = useRef(0); // Current rotation speed
  const targetRotationSpeedRef = useRef(0); // Target rotation speed (for smooth transitions)
  const angleRef = useRef(0); // Current rotation angle
  const starsRef = useRef<Array<{ x: number; y: number; size: number; baseX: number; baseY: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Generate stars
    const centerX = -canvas.width * 0.3; // Off to the left
    const centerY = -canvas.height * 0.3; // Off to the top
    const numStars = 120; // Increased from 80

    starsRef.current = Array.from({ length: numStars }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.max(canvas.width, canvas.height) * 1.5; // Spread further
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      return {
        x,
        y,
        baseX: x - centerX,
        baseY: y - centerY,
        size: Math.random() * 1.5 + 0.3, // Smaller stars
      };
    });

    // Track user activity
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      targetRotationSpeedRef.current = 0.0002; // Slow rotation when active
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('mousedown', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity);
    window.addEventListener('touchstart', onActivity);

    // Animation loop
    let animationFrame: number;
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = canvas.width;
    trailCanvas.height = canvas.height;
    const trailCtx = trailCanvas.getContext('2d', { alpha: true });

    const animate = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;

      // After 5 seconds of inactivity, speed up rotation
      if (timeSinceActivity > 5000) {
        targetRotationSpeedRef.current = 0.003; // Fast rotation when idle
      } else {
        targetRotationSpeedRef.current = 0.0003; // Slow rotation when active
      }

      // Smooth interpolation for rotation speed (easing)
      const speedEasing = 0.02;
      rotationSpeedRef.current += (targetRotationSpeedRef.current - rotationSpeedRef.current) * speedEasing;

      // Update rotation angle
      angleRef.current += rotationSpeedRef.current;

      // Clear main canvas with pitch black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fade the trail canvas for trail effect
      if (trailCtx) {
        const fadeAmount = rotationSpeedRef.current > 0.001 ? 0.92 : 0.7; // Slower fade when fast
        trailCtx.fillStyle = `rgba(0, 0, 0, ${1 - fadeAmount})`;
        trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
      }

      const centerX = -canvas.width * 0.3;
      const centerY = -canvas.height * 0.3;

      // Draw stars with rotation on trail canvas
      starsRef.current.forEach((star) => {
        const cosA = Math.cos(angleRef.current);
        const sinA = Math.sin(angleRef.current);

        // Rotate around center
        const rotatedX = star.baseX * cosA - star.baseY * sinA;
        const rotatedY = star.baseX * sinA + star.baseY * cosA;

        const x = centerX + rotatedX;
        const y = centerY + rotatedY;

        // Draw to trail canvas
        if (trailCtx) {
          trailCtx.fillStyle = '#ffffff';
          trailCtx.beginPath();
          trailCtx.arc(x, y, star.size, 0, Math.PI * 2);
          trailCtx.fill();
        }
      });

      // Composite trail canvas onto main canvas
      ctx.drawImage(trailCanvas, 0, 0);

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('touchstart', onActivity);
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
