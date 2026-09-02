'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { FlameIcon, SparkleIcon, StarIcon } from '@/components/ui/icons';

interface StreakCounterProps {
  entries: Array<{ entryDate: Date }>;
}

export function StreakCounter({ entries }: StreakCounterProps) {
  const streak = useMemo(() => {
    if (entries.length === 0) return 0;

    // Sort entries by date descending
    const sortedEntries = [...entries].sort(
      (a, b) => b.entryDate.getTime() - a.entryDate.getTime()
    );

    // Get unique dates
    const uniqueDates = Array.from(
      new Set(
        sortedEntries.map((e) => e.entryDate.toISOString().split('T')[0])
      )
    );

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's an entry today or yesterday
    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);
    const daysSinceLastEntry = Math.floor(
      (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Streak is broken if more than 1 day gap
    if (daysSinceLastEntry > 1) return 0;

    // Count consecutive days
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak + 1;
  }, [entries]);

  const StreakIcon = streak >= 7 ? FlameIcon : streak >= 3 ? SparkleIcon : StarIcon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20 border border-orange-500/30 p-6"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-300">Daily Streak</p>
          <span className="text-orange-400">
            <StreakIcon size={22} />
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <motion.span
            key={streak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-black bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent"
          >
            {streak}
          </motion.span>
          <span className="text-lg text-gray-400 font-medium">
            {streak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {streak > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            {streak >= 7
              ? "You're on fire! Keep it up!"
              : streak >= 3
              ? "Great momentum! Don't break it!"
              : "Building a habit—one day at a time"}
          </p>
        )}
      </div>
    </motion.div>
  );
}
