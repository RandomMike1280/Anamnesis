'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { QUOTES } from '@/lib/data/quotes';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizes[size]} border-2 border-white/20 border-t-white rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

export function LoadingPage() {
  // Start with index 0 on both server and client to avoid hydration mismatch,
  // then randomise on the client after mount.
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Randomise only after hydration is done
    const initial = Math.floor(Math.random() * QUOTES.length);
    setIndex(initial);
    setMounted(true);

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-8">
      <LoadingSpinner size="lg" />

      <AnimatePresence mode="wait">
        {mounted && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="max-w-md text-center space-y-3"
          >
            <p className="text-gray-300 text-lg font-serif italic leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-gray-500 text-sm tracking-wide">— {quote.author}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
