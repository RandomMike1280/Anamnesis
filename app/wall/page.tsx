'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { MailHeartIcon, HeartIcon, SparkleIcon } from '@/components/ui/icons';
import { FloatingLanterns } from '@/components/backgrounds/FloatingLanterns';
import { useRouter } from 'next/navigation';

interface WallMessage {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  user_liked?: boolean;
}

export default function LoveWallPage() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
    const liked = JSON.parse(localStorage.getItem('wall_liked') || '[]');
    setLikedIds(new Set(liked));
  }, []);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentProfile(profileData);
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('love_wall_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  }

  async function handlePost() {
    if (!draft.trim() || posting) return;
    setPosting(true);
    const { data, error } = await (supabase as any)
      .from('love_wall_messages')
      .insert({ content: draft.trim(), likes: 0 })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => [data, ...prev]);
      setDraft('');
    }
    setPosting(false);
  }

  async function handleLike(id: string) {
    if (likedIds.has(id)) return;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    const newLikes = msg.likes + 1;
    await (supabase as any).from('love_wall_messages').update({ likes: newLikes }).eq('id', id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: newLikes } : m))
    );
    const updated = new Set(likedIds);
    updated.add(id);
    setLikedIds(updated);
    localStorage.setItem('wall_liked', JSON.stringify([...updated]));
  }

  const COLORS = [
    'from-pink-900/30 to-rose-900/20 border-pink-500/20',
    'from-violet-900/30 to-purple-900/20 border-violet-500/20',
    'from-blue-900/30 to-cyan-900/20 border-blue-500/20',
    'from-amber-900/30 to-yellow-900/20 border-amber-500/20',
    'from-emerald-900/30 to-teal-900/20 border-emerald-500/20',
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <FloatingLanterns />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-16">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Home
          </button>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => router.push('/diary')}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Diary
                </button>
                <button
                  onClick={() => router.push(`/profile/${currentUser.id}`)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/10 border border-white/20 hover:border-white/40 transition-all flex items-center justify-center text-white font-semibold text-xs overflow-hidden"
                  title="Profile"
                >
                  {currentProfile?.avatar_url ? (
                    <img src={currentProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(currentProfile?.display_name || currentProfile?.username || 'U')[0].toUpperCase()}</span>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex justify-center"
          >
            <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-500/10 to-violet-500/10 border border-pink-500/20">
              <MailHeartIcon size={64} className="text-pink-400" />
            </div>
          </motion.div>
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-serif bg-gradient-to-r from-pink-200 via-violet-200 to-pink-200 bg-clip-text text-transparent">
              The Love Wall
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Leave an anonymous kind word for anyone who passes through.
              <br />
              <span className="text-gray-500">This wall exists to remind us we are not alone.</span>
            </p>
          </div>
        </motion.div>

        {/* Compose */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 sm:p-8 space-y-5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-violet-400 animate-pulse" />
            <p className="text-sm font-medium text-gray-200 tracking-wide">
              Leave a kind word anonymously
            </p>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            placeholder="You are doing better than you think…"
            rows={4}
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-base text-white placeholder-gray-500 resize-none focus:outline-none focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/20 transition-all leading-relaxed font-serif"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 tabular-nums">
              {draft.length} / 280
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePost}
              disabled={!draft.trim() || posting}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-pink-500/30 transition-all"
            >
              {posting ? 'Sending…' : 'Post'}
            </motion.button>
          </div>
        </motion.div>

        {/* Messages */}
        {messages.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="columns-1 sm:columns-2 gap-5 space-y-5"
          >
            <AnimatePresence>
              {messages.map((msg, i) => {
                const colorClass = COLORS[i % COLORS.length];
                const liked = likedIds.has(msg.id);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.6) }}
                    className={`break-inside-avoid mb-5 p-6 rounded-2xl bg-gradient-to-br ${colorClass} border backdrop-blur-sm hover:border-opacity-40 transition-all group`}
                  >
                    <p className="text-sm sm:text-base text-gray-100 leading-relaxed font-serif">
                      &ldquo;{msg.content}&rdquo;
                    </p>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                      <span className="text-xs text-gray-500 tabular-nums">
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLike(msg.id)}
                        disabled={liked}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                          liked
                            ? 'text-pink-400 cursor-default'
                            : 'text-gray-400 hover:text-pink-400 cursor-pointer'
                        }`}
                      >
                        <HeartIcon size={16} filled={liked} />
                        <span className="tabular-nums">{msg.likes}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                <SparkleIcon size={48} className="text-gray-600" />
              </div>
            </div>
            <p className="text-lg text-gray-500">The wall is quiet.</p>
            <p className="text-sm text-gray-600 mt-2">Be the first to leave a kind word.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
