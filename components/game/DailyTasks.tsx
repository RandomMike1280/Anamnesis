'use client';

import { motion } from 'framer-motion';
import type { GameData } from '@/lib/hooks/useGameData';
import { iconMap, CalendarIcon, CheckCircleIcon, CoinIcon, type IconKey } from '@/components/ui/icons';

interface DailyTasksProps {
  tasks: Array<{
    id: string;
    icon: string;
    title: string;
    desc: string;
    reward: number;
  }>;
  completedTasks: string[];
  onTaskAction: (taskId: string) => void;
}

export function DailyTasks({ tasks, completedTasks, onTaskAction }: DailyTasksProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-900/30 via-yellow-900/20 to-orange-900/30 border-2 border-amber-500/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon size={18} className="text-amber-400" /> Daily Missions
          </h3>
          <p className="text-xs text-amber-400/70 mt-1">
            Refresh every day • Complete to earn coins
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-400">
            {completedTasks.length}/{tasks.length}
          </p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const isCompleted = completedTasks.includes(task.id);
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center justify-between gap-4 p-4 rounded-xl
                transition-all duration-200 border
                ${
                  isCompleted
                    ? 'bg-white/5 border-white/10 opacity-60'
                    : 'bg-white/10 border-amber-500/20 hover:border-amber-500/40'
                }
              `}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span
                  className={`flex-shrink-0 mt-0.5 ${
                    isCompleted ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircleIcon size={24} />
                  ) : (
                    (() => {
                      const TaskIcon = iconMap[task.icon as IconKey];
                      return TaskIcon ? <TaskIcon size={24} /> : null;
                    })()
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-bold text-sm ${
                      isCompleted ? 'text-gray-500 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.desc}</p>
                  <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
                    <CoinIcon size={12} /> +{task.reward} coins
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: isCompleted ? 1 : 1.05 }}
                whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                onClick={() => !isCompleted && onTaskAction(task.id)}
                disabled={isCompleted}
                className={`
                  px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap
                  transition-all flex-shrink-0
                  ${
                    isCompleted
                      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/50'
                  }
                `}
              >
                {isCompleted ? 'Done' : 'Start'}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-black/30 rounded-lg border border-amber-500/20">
        <p className="text-xs text-amber-400/70 text-center">
          Tip: Write diary entries and care for your tree to earn coins daily!
        </p>
      </div>
    </div>
  );
}
