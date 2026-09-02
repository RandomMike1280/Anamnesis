'use client';

import { motion } from 'framer-motion';
import { getDailyQuote } from '@/lib/data/quotes';

/**
 * Shows today's quote — deterministic so it stays the same all day.
 * Drop this anywhere you want a permanent, readable quote surface.
 */
export function DailyQuote() {
  const quote = getDailyQuote();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center space-y-3"
    >
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
        Today&apos;s Reflection
      </p>
      <p className="text-gray-200 font-serif italic leading-relaxed text-base">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-gray-500 text-sm">— {quote.author}</p>
    </motion.div>
  );
}
