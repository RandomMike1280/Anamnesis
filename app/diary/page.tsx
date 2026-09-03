'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { encryptData, decryptData, decryptDEK, encodeDEK } from '@/lib/crypto/envelope';
import { formatDate, getRelativeTime } from '@/lib/utils';
import type { DiaryEntry } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import { StarTrailBackground } from '@/components/diary/StarTrailBackground';
import { MoodCalendar } from '@/components/diary/MoodCalendar';
import { StreakCounter } from '@/components/ui/StreakCounter';
import { MemoryTree } from '@/components/game/MemoryTree';
import { DailyTasks } from '@/components/game/DailyTasks';
import { InterviewMode } from '@/components/diary/InterviewMode';
import { MemoryCapsules } from '@/components/diary/MemoryCapsules';
import { PINSetup } from '@/components/auth/PINSetup';
import { useGameData } from '@/lib/hooks/useGameData';
import { CalendarIcon, TreeIcon, ClipboardIcon, MicIcon, HourglassIcon, CoinIcon, LockIcon } from '@/components/ui/icons';
import { DailyQuote } from '@/components/ui/DailyQuote';

export default function DiaryPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [dek, setDEK] = useState<Uint8Array | null>(null);
  const [needsPINSetup, setNeedsPINSetup] = useState(false);
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Default to today
  const [rightTab, setRightTab] = useState<'calendar' | 'tree' | 'tasks' | 'interview' | 'capsules'>('calendar');
  const router = useRouter();
  const { data: gameData, dailyTasks, waterTree, completeTask, onDiarySaved } = useGameData();

  useEffect(() => {
    checkUser();
  }, []);

  // Check for auto mood analysis (once per day)
  useEffect(() => {
    if (user && entries.length > 0 && dek) {
      checkAndRunAutoMoodAnalysis();
    }
  }, [user, entries, dek]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    // Check if user has set up PIN/DEK
    if (!profileData?.encrypted_dek) {
      setNeedsPINSetup(true);
      setLoading(false);
    } else {
      setShowPINPrompt(true);
      setLoading(false);
    }
  };

  const loadEntries = async (userId: string, dekToUse?: Uint8Array) => {
    const activeDEK = dekToUse || dek;
    if (!activeDEK) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;

      // Decrypt entries client-side
      const decryptedEntries = await Promise.all(
        (data || []).map(async (entry: any) => {
          try {
            const content = await decryptData(entry.encrypted_content, activeDEK);
            return {
              id: entry.id,
              userId: entry.user_id,
              content,
              createdAt: new Date(entry.created_at),
              updatedAt: new Date(entry.updated_at),
              entryDate: new Date(entry.entry_date),
            };
          } catch {
            return {
              id: entry.id,
              userId: entry.user_id,
              content: '[Failed to decrypt]',
              createdAt: new Date(entry.created_at),
              updatedAt: new Date(entry.updated_at),
              entryDate: new Date(entry.entry_date),
            };
          }
        })
      );

      setEntries(decryptedEntries);
    } catch (error: any) {
      console.error('Error loading entries:', error);
      console.error('Error details:', error?.message, error?.code, error?.details);
    } finally {
      setLoading(false);
    }
  };

  const checkAndRunAutoMoodAnalysis = async () => {
    if (!profile?.last_mood_update) {
      // Never analyzed before - don't auto-run on first load
      return;
    }

    const lastUpdate = new Date(profile.last_mood_update);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // Auto-analyze if it's been more than 24 hours
    if (hoursSinceUpdate > 24) {
      console.log('Auto-running mood analysis (24h passed)');
      runMoodAnalysis(true);
    }
  };

  const saveEntry = async () => {
    if (!newEntry.trim() || !dek || !user || !selectedDate) return;

    setSaving(true);
    try {
      // Encrypt content client-side
      const encryptedContent = await encryptData(newEntry, dek);

      console.log('Saving entry for user:', user.id);

      // Use selected date instead of current date
      const entryDateStr = selectedDate.toISOString().split('T')[0];

      const { data, error } = await (supabase as any).from('diary_entries').insert({
        user_id: user.id,
        encrypted_content: encryptedContent,
        entry_date: entryDateStr,
      }).select();

      console.log('Save result:', { data, error });

      if (error) {
        console.error('Save error details:', error);
        throw error;
      }

      console.log('Entry saved successfully:', data);

      onDiarySaved(newEntry);
      setNewEntry('');
      await loadEntries(user.id);
    } catch (error: any) {
      console.error('Error saving entry:', error);
      console.error('Error details:', error?.message, error?.code, error?.details);
      alert(`Failed to save entry: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const runMoodAnalysis = async (silent = false) => {
    if (!user || entries.length === 0 || !dek) return;

    setAnalyzing(true);
    try {
      if (!silent) {
        console.log('Running mood analysis...');
      }

      // Call the API route to analyze mood
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          dekBase64: encodeDEK(dek),
          limit: 5,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze mood');
      }

      const mood = await response.json();

      if (!silent) {
        alert(`Mood updated: ${mood.mood} (${Math.round(mood.confidence * 100)}% confidence)`);
      }

      // Reload profile to get updated mood
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    } catch (error: any) {
      console.error('Error analyzing mood:', error);
      if (!silent) {
        alert(`Failed to analyze mood: ${error.message}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <LoadingPage />;

  // First-time PIN setup
  if (needsPINSetup) {
    return (
      <PINSetup
        userId={user.id}
        onComplete={async (newPIN, newDEK) => {
          setDEK(newDEK);
          setNeedsPINSetup(false);
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setProfile(profileData);
          await loadEntries(user.id, newDEK);
        }}
      />
    );
  }

  // PIN unlock prompt
  if (showPINPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 backdrop-blur-md">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
                <LockIcon size={32} className="text-violet-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Enter PIN</h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              Enter your diary PIN to decrypt your entries.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPinError('');
                try {
                  const decryptedDEK = await decryptDEK(profile.encrypted_dek, pinInput);
                  setDEK(decryptedDEK);
                  setShowPINPrompt(false);
                  setLoading(true);
                  await loadEntries(user.id, decryptedDEK);
                } catch {
                  setPinError('Incorrect PIN');
                }
              }}
              className="space-y-4"
            >
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                maxLength={12}
                autoFocus
                className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              {pinError && (
                <p className="text-sm text-red-400 text-center">{pinError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all disabled:opacity-40"
                disabled={!pinInput}
              >
                Unlock
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen p-4 md:p-8 bg-black">
      {/* Star trail background */}
      <StarTrailBackground />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-8"
        >
          <div>
            <h1 className="text-4xl font-serif bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              Your Inner Cosmos
            </h1>
            {profile?.mood && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: profile.mood_color }}
                  />
                  <p className="text-sm text-gray-400">
                    Currently feeling <span className="text-white capitalize">{profile.mood}</span>
                    {profile.last_mood_update && (
                      <span className="text-gray-600 ml-2">
                        • Updated {getRelativeTime(profile.last_mood_update)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-amber-400 font-bold flex items-center gap-1.5">
                    <CoinIcon size={16} /> {gameData.coins}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/wall')}>
              Love Wall
            </Button>
            <Button variant="ghost" onClick={() => router.push('/sky')}>
              View Sky
            </Button>
            <button
              onClick={() => router.push(`/profile/${user.id}`)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/10 border border-white/20 hover:border-white/40 transition-all flex items-center justify-center text-white font-semibold"
              title="Profile"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm">{(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}</span>
              )}
            </button>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Entry Input */}
          <div className="space-y-6">
            {/* Streak Counter */}
            {dek && entries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <StreakCounter entries={entries} />
              </motion.div>
            )}

            {dek && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20">
                  <Textarea
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="What's weighing on your soul today?"
                    rows={12}
                    className="mb-4 bg-white/5 text-lg leading-relaxed"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      onClick={() => runMoodAnalysis(false)}
                      disabled={analyzing || entries.length === 0}
                      className="text-sm"
                    >
                      {analyzing ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        'Update Mood'
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={saveEntry}
                      disabled={saving || !newEntry.trim()}
                    >
                      {saving ? 'Saving...' : 'Save Entry'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Mood updates automatically every 24 hours
                  </p>
                </Card>
              </motion.div>
            )}

            {/* PIN status indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-white/5 to-white/5 border-white/10">
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <LockIcon size={14} className="text-emerald-400" />
                    <span>PIN-encrypted diary</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => loadEntries(user.id)}>
                    Refresh
                  </Button>
                </div>
                {dek && (
                  <p className="text-xs text-gray-500 mt-2">
                    Encrypted
                  </p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right side - Tabbed Panel */}
          <div className="space-y-4">
            {/* Daily Quote */}
            <DailyQuote />

            {/* Tab Bar */}
            <div className="flex gap-1 overflow-x-auto p-1 bg-white/5 border border-white/10 rounded-xl">
              {[
                { id: 'calendar', Icon: CalendarIcon,  title: 'Calendar' },
                { id: 'tree',     Icon: TreeIcon,      title: 'Tree' },
                { id: 'tasks',    Icon: ClipboardIcon, title: 'Tasks' },
                { id: 'interview',Icon: MicIcon,       title: 'Interview' },
                { id: 'capsules', Icon: HourglassIcon, title: 'Capsules' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id as typeof rightTab)}
                  className={`
                    flex-1 py-2 px-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                    flex items-center justify-center gap-1.5
                    ${rightTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-gray-500 hover:text-gray-300'}
                  `}
                >
                  <tab.Icon size={14} /> {tab.title}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {rightTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20">
                    {dek ? (
                      <MoodCalendar
                        entries={entries}
                        currentMood={profile?.mood}
                        currentMoodColor={profile?.mood_color}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="flex justify-center mb-4">
                          <LockIcon size={40} />
                        </div>
                        <p className="text-lg">Locked</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {rightTab === 'tree' && (
                <motion.div
                  key="tree"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MemoryTree
                    level={gameData.tree.level}
                    exp={gameData.tree.exp}
                    canWater={!gameData.daily.watered}
                    onWater={waterTree}
                  />
                </motion.div>
              )}

              {rightTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DailyTasks
                    tasks={dailyTasks}
                    completedTasks={gameData.daily.completedTasks}
                    onTaskAction={(id) => completeTask(id)}
                  />
                </motion.div>
              )}

              {rightTab === 'interview' && (
                <motion.div
                  key="interview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <InterviewMode />
                </motion.div>
              )}

              {rightTab === 'capsules' && user && (
                <motion.div
                  key="capsules"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MemoryCapsules userId={user.id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
