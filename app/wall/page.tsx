'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { MailHeartIcon, HeartIcon, SparkleIcon } from '@/components/ui/icons';

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

  useEffect(() => {
    loadMessages();
    const liked = JSON.parse(localStorage.getItem('wall_liked') || '[]');
    setLikedIds(new Set(liked));
  }, []);

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
    'from-pink-900/40 to-rose-900/30 border-pink-500/25',
    'from-violet-900/40 to-purple-900/30 border-violet-500/25',
    'from-blue-900/40 to-cyan-900/30 border-blue-500/25',
    'from-amber-900/40 to-yellow-900/30 border-amber-500/25',
    'from-emerald-900/40 to-teal-900/30 border-emerald-500/25',
  ];

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(155,89,182,0.15),transparent_60%)]" />

      <div className="relative max-w-3xl mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center text-pink-400"
          >
            <MailHeartIcon size={56} />
          </motion.div>
          <h1 className="text-4xl font-serif text-white">The Love Wall</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Leave an anonymous kind word for anyone who passes through.
            This wall exists to remind us we are not alone.
          </p>
        </div>

        {/* Compose */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <p className="text-sm font-medium text-gray-300">Leave a kind word anonymously</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            placeholder="You are doing better than you think…"
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-violet-400 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{draft.length}/280</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePost}
              disabled={!draft.trim() || posting}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              {posting ? 'Sending…' : 'Post'}
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => {
              const colorClass = COLORS[i % COLORS.length];
              const liked = likedIds.has(msg.id);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`break-inside-avoid mb-4 p-5 rounded-2xl bg-gradient-to-br ${colorClass} border`}
                >
                  <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleLike(msg.id)}
                      className={`flex items-center gap-1 text-xs font-bold transition-all ${
                        liked ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'
                      }`}
                    >
                      <HeartIcon size={14} filled={liked} />
                      <span>{msg.likes}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <div className="flex justify-center mb-3">
              <SparkleIcon size={36} />
            </div>
            <p>The wall is quiet. Be the first to leave a kind word.</p>
          </div>
        )}
      </div>
    </main>
  );
}
