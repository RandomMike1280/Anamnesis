'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SHORT_QUOTES, getRandomShortQuote } from '@/lib/data/quotes';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizes[size]} border-2 border-white/20 border-t-white rounded-full animate-spin`}
    />
  );
}

export function LoadingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-10 px-8">
      <LoadingSpinner size="lg" />

      <div className="max-w-md text-center space-y-3">
        {/* Suppress hydration warning - this content is immediately updated by inline script */}
        <p
          id="loading-quote-text"
          className="text-gray-300 text-lg font-serif italic leading-relaxed"
          suppressHydrationWarning
        >
          &ldquo;Loading...&rdquo;
        </p>
        <p
          id="loading-quote-author"
          className="text-gray-500 text-sm tracking-wide"
          suppressHydrationWarning
        >
          —
        </p>
      </div>

      {/* Initialize quote rotation immediately after elements render */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            if (window.initLoadingQuotes) {
              window.initLoadingQuotes();
            }
          })();
        `
      }} />
    </div>
  );
}
