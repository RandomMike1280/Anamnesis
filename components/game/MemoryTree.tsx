'use client';

import { motion } from 'framer-motion';
import { TREE_STAGES } from '@/lib/hooks/useGameData';
import { iconMap, DropIcon, CheckCircleIcon, SparkleIcon, type IconKey } from '@/components/ui/icons';

interface MemoryTreeProps {
  level: number;
  exp: number;
  canWater: boolean;
  onWater: () => void;
}

export function MemoryTree({ level, exp, canWater, onWater }: MemoryTreeProps) {
  const stage = TREE_STAGES[level - 1] || TREE_STAGES[0];
  const StageIcon = iconMap[stage.icon as IconKey];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 via-green-900/20 to-teal-900/30 border-2 border-emerald-500/30 p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent_50%)]" />

      <div className="relative space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">
            Level {level}
          </p>
          <p className="text-sm font-medium text-emerald-300">{stage.name}</p>
          <p className="text-xs text-emerald-500/70 mt-1">{stage.desc}</p>
        </div>

        <motion.div
          animate={{
            rotate: [-2, 2, -2],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex justify-center my-6 text-emerald-300 filter drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        >
          <StageIcon size={88} />
        </motion.div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-400">Growth Progress</span>
            <span className="text-emerald-400">{exp} / 100 EP</span>
          </div>

          <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-emerald-500/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${exp}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: canWater ? 1.05 : 1 }}
            whileTap={{ scale: canWater ? 0.95 : 1 }}
            onClick={onWater}
            disabled={!canWater}
            className={`
              flex-1 py-3 px-4 rounded-xl font-bold text-sm
              transition-all duration-200
              ${
                canWater
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:shadow-lg hover:shadow-emerald-500/50'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {canWater ? (
                <>
                  <DropIcon size={16} /> Water Today (+20 EP, +10 coins)
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} /> Watered Today
                </>
              )}
            </span>
          </motion.button>
        </div>

        {level >= 4 && exp >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg"
          >
            <p className="text-sm font-bold text-yellow-400 flex items-center justify-center gap-2">
              <SparkleIcon size={16} /> Your Memory Tree is fully grown!
            </p>
            <p className="text-xs text-yellow-300/70 mt-1">
              Keep writing to maintain your beautiful tree
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
