'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { HourglassIcon, LockIcon, UnlockIcon } from '@/components/ui/icons';

interface Capsule {
  id: string;
  message: string;
  unlock_year: number;
  created_at: string;
  is_unlocked: boolean;
}

export function MemoryCapsules({ userId }: { userId: string }) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [message, setMessage] = useState('');
  const [unlockYear, setUnlockYear] = useState(new Date().getFullYear() + 1);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('memory_capsules')
        .select('*')
        .eq('user_id', userId)
        .order('unlock_year', { ascending: true });
      if (data) setCapsules(data);
    }
    load();
  }, [userId]);

  async function handleSave() {
    if (!message.trim() || saving) return;
    setSaving(true);
    const { data, error } = await (supabase as any)
      .from('memory_capsules')
      .insert({
        user_id: userId,
        message: message.trim(),
        unlock_year: unlockYear,
        is_unlocked: false,
      })
      .select()
      .single();
    if (!error && data) {
      setCapsules((prev) => [...prev, data]);
      setMessage('');
      setShowForm(false);
    }
    setSaving(false);
  }

  const lockedCapsules = capsules.filter((c) => !c.is_unlocked && c.unlock_year > currentYear);
  const unlockedCapsules = capsules.filter((c) => c.unlock_year <= currentYear);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-300">
            <HourglassIcon size={24} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">Memory Capsules</h3>
            <p className="text-xs text-gray-400">Write a letter to your future self</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm"
        >
          {showForm ? 'Cancel' : '+ New Capsule'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl bg-violet-900/20 border border-violet-500/30 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something to your future self..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-violet-400"
              />
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-300 whitespace-nowrap">Unlock in year:</label>
                <input
                  type="number"
                  min={currentYear + 1}
                  max={currentYear + 20}
                  value={unlockYear}
                  onChange={(e) => setUnlockYear(Number(e.target.value))}
                  className="w-28 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={!message.trim() || saving}
                  className="ml-auto px-5 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm disabled:opacity-50"
                >
                  {saving ? 'Sealing...' : 'Seal Capsule'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {unlockedCapsules.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <UnlockIcon size={13} /> Unlocked
          </p>
          {unlockedCapsules.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/30"
            >
              <p className="text-sm text-white leading-relaxed">{c.message}</p>
              <p className="text-xs text-emerald-400 mt-2">
                Written in {new Date(c.created_at).getFullYear()} · Unlocked {c.unlock_year}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {lockedCapsules.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
            <LockIcon size={13} /> Sealed
          </p>
          {lockedCapsules.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-violet-900/20 border border-violet-500/20 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-400 italic">A message sealed away…</p>
                <p className="text-xs text-violet-400 mt-1">
                  Opens in {c.unlock_year} · {c.unlock_year - currentYear} year{c.unlock_year - currentYear !== 1 ? 's' : ''} to go
                </p>
              </div>
              <span className="text-violet-400">
                <LockIcon size={26} />
              </span>
            </div>
          ))}
        </div>
      )}

      {capsules.length === 0 && !showForm && (
        <div className="text-center py-8">
          <div className="flex justify-center mb-3 text-gray-500">
            <HourglassIcon size={36} />
          </div>
          <p className="text-gray-400 text-sm">No capsules yet.</p>
          <p className="text-gray-500 text-xs mt-1">Write a letter to your future self!</p>
        </div>
      )}
    </div>
  );
}
