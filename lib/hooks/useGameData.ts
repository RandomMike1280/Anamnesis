'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TreeData {
  level: number; // 1-4
  exp: number;   // 0-100
}

export interface DailyState {
  date: string;
  watered: boolean;
  completedTasks: string[];
}

export interface GameData {
  coins: number;
  tree: TreeData;
  daily: DailyState;
}

export const TREE_STAGES = [
  { icon: 'sprout', name: 'New Sprout', desc: 'A tender new beginning' },
  { icon: 'vine', name: 'Growing Vine', desc: 'Taking root in the world' },
  { icon: 'plant', name: 'Budding Plant', desc: 'Memories starting to bloom' },
  { icon: 'tree', name: 'Memory Tree', desc: 'A tree full of stories' },
] as const;

export const DAILY_TASK_POOL = [
  { id: 'diary',     icon: 'pen',       title: 'Write a diary entry',   desc: 'Capture a memory or feeling.',         reward: 30 },
  { id: 'diaryLong', icon: 'book',      title: 'Write deeply (100+ chars)', desc: 'A longer, more reflective entry.', reward: 50 },
  { id: 'mood',      icon: 'moon',      title: "Set today's mood",       desc: 'Let your star reflect how you feel.',  reward: 20 },
  { id: 'interview', icon: 'mic',       title: 'Answer an interview prompt', desc: 'Learn about someone you love.',    reward: 40 },
  { id: 'capsule',   icon: 'hourglass', title: 'Write a memory capsule', desc: 'A message to your future self.',      reward: 45 },
  { id: 'wall',      icon: 'mail',      title: 'Leave a kind word',      desc: 'Post to the Love Wall.',               reward: 25 },
];

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyTasksForDay(): typeof DAILY_TASK_POOL {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const a = seed % DAILY_TASK_POOL.length;
  const b = (Math.floor(seed / 7) + 2) % DAILY_TASK_POOL.length;
  const c = (Math.floor(seed / 31) + 4) % DAILY_TASK_POOL.length;
  return [DAILY_TASK_POOL[a], DAILY_TASK_POOL[b], DAILY_TASK_POOL[c]].filter(
    (x, i, arr) => arr.findIndex((y) => y.id === x.id) === i
  );
}

const STORAGE_KEY = 'space_of_sonder_game_v1';

const defaultGameData: GameData = {
  coins: 0,
  tree: { level: 1, exp: 0 },
  daily: { date: todayKey(), watered: false, completedTasks: [] },
};

export function useGameData() {
  const [data, setData] = useState<GameData>(defaultGameData);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: GameData = JSON.parse(raw);
        // Reset daily state if it's a new day
        if (saved.daily?.date !== todayKey()) {
          saved.daily = { date: todayKey(), watered: false, completedTasks: [] };
        }
        setData({ ...defaultGameData, ...saved });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const save = useCallback((updated: GameData) => {
    setData(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage full — silent fail
    }
  }, []);

  const addExp = useCallback((amount: number, current: GameData): GameData => {
    let { level, exp } = current.tree;
    exp += amount;
    let bonusCoins = 0;
    while (exp >= 100 && level < 4) {
      exp -= 100;
      level++;
      bonusCoins += 50; // level-up bonus
    }
    if (level >= 4) exp = Math.min(exp, 100);
    return {
      ...current,
      coins: current.coins + bonusCoins,
      tree: { level, exp },
    };
  }, []);

  const waterTree = useCallback(() => {
    setData((prev) => {
      if (prev.daily.watered) return prev;
      const updated = addExp(20, {
        ...prev,
        coins: prev.coins + 10,
        daily: { ...prev.daily, watered: true },
      });
      save(updated);
      return updated;
    });
  }, [addExp, save]);

  const completeTask = useCallback((taskId: string, entryContent?: string) => {
    setData((prev) => {
      if (prev.daily.completedTasks.includes(taskId)) return prev;
      const task = DAILY_TASK_POOL.find((t) => t.id === taskId);
      if (!task) return prev;
      // Extra check for long diary
      if (taskId === 'diaryLong' && (!entryContent || entryContent.length < 100)) return prev;

      let updated = addExp(10, {
        ...prev,
        coins: prev.coins + task.reward,
        daily: {
          ...prev.daily,
          completedTasks: [...prev.daily.completedTasks, taskId],
        },
      });
      save(updated);
      return updated;
    });
  }, [addExp, save]);

  const onDiarySaved = useCallback((content: string) => {
    setData((prev) => {
      let updated = addExp(30, { ...prev, coins: prev.coins + 30 });
      // Complete diary task
      if (!updated.daily.completedTasks.includes('diary')) {
        updated = {
          ...updated,
          coins: updated.coins + (DAILY_TASK_POOL.find((t) => t.id === 'diary')?.reward ?? 0),
          daily: { ...updated.daily, completedTasks: [...updated.daily.completedTasks, 'diary'] },
        };
      }
      // Complete long diary task
      if (content.length >= 100 && !updated.daily.completedTasks.includes('diaryLong')) {
        updated = {
          ...updated,
          coins: updated.coins + (DAILY_TASK_POOL.find((t) => t.id === 'diaryLong')?.reward ?? 0),
          daily: { ...updated.daily, completedTasks: [...updated.daily.completedTasks, 'diaryLong'] },
        };
      }
      save(updated);
      return updated;
    });
  }, [addExp, save]);

  const dailyTasks = getDailyTasksForDay();

  return {
    data,
    dailyTasks,
    waterTree,
    completeTask,
    onDiarySaved,
  };
}
