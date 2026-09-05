'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { decryptData, decryptDEK, encodeDEK } from '@/lib/crypto/envelope';
import type { DiaryEntry } from '@/types';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { StarTrailBackground } from '@/components/diary/StarTrailBackground';
import { LockIcon } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimelinePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [dek, setDEK] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [hoveredEntry, setHoveredEntry] = useState<DiaryEntry | null>(null);
  const [lockTimer, setLockTimer] = useState<number>(300);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (dek && !isLocked) {
      const intervalId = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            lockTimeline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [dek, isLocked]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    if (!profileData?.encrypted_dek) {
      router.push('/diary');
      return;
    }

    // Check session
    const unlockTimeStr = sessionStorage.getItem('diaryUnlockTime');
    const storedDEK = sessionStorage.getItem('diaryDEK');

    if (unlockTimeStr && storedDEK) {
      const unlockTime = parseInt(unlockTimeStr, 10);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - unlockTime) / 1000);

      if (elapsedSeconds < 300) {
        const remainingTime = 300 - elapsedSeconds;
        setLockTimer(remainingTime);

        const dekBytes = Uint8Array.from(atob(storedDEK), c => c.charCodeAt(0));
        setDEK(dekBytes);
        setIsLocked(false);

        await loadEntries(user.id, dekBytes);
      } else {
        sessionStorage.removeItem('diaryUnlockTime');
        sessionStorage.removeItem('diaryDEK');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const loadEntries = async (userId: string, dekToUse: Uint8Array) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;

      const decryptedEntries = await Promise.all(
        (data || []).map(async (entry: any) => {
          try {
            const content = await decryptData(entry.encrypted_content, dekToUse);
            return {
              id: entry.id,
              userId: entry.user_id,
              content,
              createdAt: new Date(entry.created_at),
              updatedAt: new Date(entry.updated_at),
              entryDate: new Date(entry.entry_date),
              mood: entry.mood,
              moodColor: entry.mood_color,
              moodConfidence: entry.mood_confidence,
            };
          } catch {
            return null;
          }
        })
      );

      setEntries(decryptedEntries.filter((e): e is DiaryEntry => e !== null));
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockTimeline = async (pin: string) => {
    try {
      const decryptedDEK = await decryptDEK(profile.encrypted_dek, pin);
      setDEK(decryptedDEK);
      setIsLocked(false);
      setLockTimer(300);
      setPinError('');

      sessionStorage.setItem('diaryUnlockTime', Date.now().toString());
      sessionStorage.setItem('diaryDEK', encodeDEK(decryptedDEK));

      await loadEntries(user.id, decryptedDEK);
      return true;
    } catch {
      setPinError('Incorrect PIN');
      return false;
    }
  };

  const lockTimeline = () => {
    setIsLocked(true);
    setLockTimer(0);
    sessionStorage.removeItem('diaryUnlockTime');
    sessionStorage.removeItem('diaryDEK');
  };

  const resetLockTimer = () => {
    if (!isLocked) {
      setLockTimer(300);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <StarTrailBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-serif">Timeline</h1>
            <div className="flex gap-4 text-sm">
              <button
                onClick={() => router.push('/diary')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Diary
              </button>
              <button
                onClick={() => router.push('/sky')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Sky
              </button>
              <button
                onClick={() => router.push('/wall')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Love Wall
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isLocked && dek && (
              <>
                <span className="text-xs text-gray-500">
                  {Math.floor(lockTimer / 60)}:{String(lockTimer % 60).padStart(2, '0')}
                </span>
                <Button size="sm" variant="ghost" onClick={lockTimeline}>
                  <LockIcon size={14} className="mr-1" />
                  Lock
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/profile/${user?.id}`)}
            >
              Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
              <LockIcon size={40} className="text-violet-400" />
            </div>
            <h2 className="text-2xl font-serif mb-2">Timeline is Locked</h2>
            <p className="text-gray-400 mb-8">Enter your PIN to view your timeline</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await unlockTimeline(pinInput);
                if (!pinError) {
                  setPinInput('');
                }
              }}
              className="w-full max-w-xs"
            >
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="Enter 6-digit PIN"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-2"
              />
              {pinError && (
                <p className="text-red-400 text-sm text-center mb-2">{pinError}</p>
              )}
              <Button type="submit" className="w-full">
                Unlock Timeline (5 min)
              </Button>
            </form>
          </motion.div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg mb-4">No entries yet</p>
            <Button onClick={() => router.push('/diary')}>
              Write Your First Entry
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
            onMouseMove={resetLockTimer}
            onScroll={resetLockTimer}
          >
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/40 via-white/20 to-white/40" />

            {/* Timeline Entries */}
            <div className="space-y-12 pb-20">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-20"
                  onMouseEnter={() => setHoveredEntry(entry)}
                  onMouseLeave={() => setHoveredEntry(null)}
                >
                  {/* Timeline Circle */}
                  <motion.div
                    className="absolute left-4 top-2 w-8 h-8 rounded-full border-4 border-black cursor-pointer"
                    style={{
                      backgroundColor: entry.moodColor || '#9333ea',
                      boxShadow: hoveredEntry?.id === entry.id
                        ? `0 0 20px ${entry.moodColor || '#9333ea'}`
                        : `0 0 10px ${entry.moodColor || '#9333ea'}80`,
                    }}
                    whileHover={{ scale: 1.3 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  />

                  {/* Date Label */}
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-400">
                      {entry.entryDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {entry.mood && (
                      <p className="text-xs text-gray-500 capitalize">
                        Mood: {entry.mood}
                        {entry.moodConfidence && ` (${Math.round(entry.moodConfidence * 100)}%)`}
                      </p>
                    )}
                  </div>

                  {/* Entry Preview */}
                  <AnimatePresence>
                    {hoveredEntry?.id === entry.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="p-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg backdrop-blur-sm"
                          style={{
                            borderColor: `${entry.moodColor}40`,
                          }}
                        >
                          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {entry.content}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="text-center pt-8 border-t border-white/10">
              <p className="text-sm text-gray-500">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your timeline
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
