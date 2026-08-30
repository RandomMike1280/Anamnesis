'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { encrypt, decrypt } from '@/lib/crypto/encryption';
import { analyzeMood } from '@/lib/ai/mood-analysis';
import { formatDate, getRelativeTime } from '@/lib/utils';
import type { DiaryEntry } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiaryPage() {
  const [user, setUser] = useState<any>(null);
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

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);
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
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!newEntry.trim() || !password || !user) return;

    setSaving(true);
    try {
      // Encrypt content client-side
      const encryptedContent = await encrypt(newEntry, password);

      const { error } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        encrypted_content: encryptedContent,
        entry_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      setNewEntry('');
      await loadEntries(user.id);

      // Trigger mood analysis
      runMoodAnalysis();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const runMoodAnalysis = async () => {
    if (!user || entries.length === 0) return;

    setAnalyzing(true);
    try {
      // Get last 5 entries
      const recentEntries = entries.slice(0, 5).map(e => e.content);

      const mood = await analyzeMood(recentEntries);

      // Update profile with new mood
      await supabase
        .from('profiles')
        .update({
          mood: mood.mood,
          mood_color: mood.color_hex,
          mood_confidence: mood.confidence,
          last_mood_update: new Date().toISOString(),
        })
        .eq('id', user.id);

      alert(`Mood updated: ${mood.mood} (${Math.round(mood.confidence * 100)}% confidence)`);
    } catch (error) {
      console.error('Error analyzing mood:', error);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Your Diary</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push('/sky')}>
              View Sky
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Password Input (one-time) */}
        {!password && (
          <Card className="mb-8">
            <h2 className="text-lg font-medium mb-4">Enter your password to decrypt entries</h2>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadEntries(user.id)}
                placeholder="Password"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <Button onClick={() => loadEntries(user.id)}>
                Unlock
              </Button>
            </div>
          </Card>
        )}

        {/* New Entry */}
        {password && (
          <Card className="mb-8">
            <Textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="What's on your mind today?"
              rows={6}
              className="mb-4"
            />
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={runMoodAnalysis}
                disabled={analyzing || entries.length === 0}
              >
                {analyzing ? 'Analyzing...' : 'Analyze Mood'}
              </Button>
              <Button
                variant="secondary"
                onClick={saveEntry}
                disabled={saving || !newEntry.trim()}
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </Card>
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
                <Card hover>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        {formatDate(entry.entryDate)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {getRelativeTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {entries.length === 0 && password && (
            <div className="text-center py-12 text-gray-500">
              <p>No entries yet. Start writing to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
