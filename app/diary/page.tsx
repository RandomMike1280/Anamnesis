'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { encrypt, decrypt } from '@/lib/crypto/encryption';
import { formatDate, getRelativeTime } from '@/lib/utils';
import type { DiaryEntry } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiaryPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  // Check for auto mood analysis (once per day)
  useEffect(() => {
    if (user && entries.length > 0 && password) {
      checkAndRunAutoMoodAnalysis();
    }
  }, [user, entries, password]);

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
    loadEntries(user.id);
  };

  const loadEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Decrypt entries client-side
      const decryptedEntries = await Promise.all(
        data.map(async (entry) => {
          try {
            const content = password
              ? await decrypt(entry.encrypted_content, password)
              : '[Locked - Enter password to decrypt]';
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
              content: '[Failed to decrypt - Wrong password?]',
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
    if (!newEntry.trim() || !password || !user) return;

    setSaving(true);
    try {
      // Encrypt content client-side
      const encryptedContent = await encrypt(newEntry, password);

      console.log('Saving entry for user:', user.id);

      const { data, error } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        encrypted_content: encryptedContent,
        entry_date: new Date().toISOString().split('T')[0],
      }).select();

      console.log('Save result:', { data, error });

      if (error) {
        console.error('Save error details:', error);
        throw error;
      }

      console.log('Entry saved successfully:', data);

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
    if (!user || entries.length === 0 || !password) return;

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
          password: password,
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Background gradient */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-star-gold/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-star-blue/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
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
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push('/sky')}>
              View Sky
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 bg-gradient-to-br from-white/10 to-white/5">
            <h2 className="text-lg font-medium mb-4">
              {password ? 'Encryption password' : 'Enter your password to decrypt entries'}
            </h2>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadEntries(user.id)}
                placeholder="Password"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-star-gold/50 transition-all"
              />
              <Button onClick={() => loadEntries(user.id)}>
                {password ? 'Reload' : 'Unlock'}
              </Button>
            </div>
            {password && (
              <p className="text-xs text-gray-500 mt-2">
                🔒 All entries encrypted with this password
              </p>
            )}
          </Card>
        </motion.div>

        {/* New Entry */}
        {password && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-8 bg-gradient-to-br from-white/10 to-white/5 border-white/20">
              <Textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="What's weighing on your soul today?"
                rows={6}
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
                    '✨ Update Mood'
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
                💡 Mood updates automatically every 24 hours
              </p>
            </Card>
          </motion.div>
        )}

        {/* Entries Timeline */}
        <div className="space-y-4">
          <AnimatePresence>
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        {formatDate(entry.entryDate)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {getRelativeTime(entry.createdAt)}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-star-gold/50 rounded-full" />
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-lg">
                    {entry.content}
                  </p>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {entries.length === 0 && password && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-gray-500"
            >
              <div className="text-4xl mb-4">✨</div>
              <p className="text-lg">No entries yet</p>
              <p className="text-sm mt-2">Start writing to see them appear here</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
