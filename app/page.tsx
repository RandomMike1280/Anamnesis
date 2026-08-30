'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { LoadingPage } from '@/components/ui/Loading';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push('/diary');
    } else {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-star-gold/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-star-blue/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-star-violet/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-2xl text-center space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-7xl font-serif text-glow mb-4 bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
            Space of Sonder
          </h1>
          <p className="text-2xl text-gray-400 mb-2">
            A private diary that becomes a public constellation
          </p>
          <p className="text-sm text-gray-600">
            Write in solitude. Shine together.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex gap-4 justify-center pt-8"
        >
          <motion.a
            href="/auth"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-star-gold/20 to-star-gold/10 hover:from-star-gold/30 hover:to-star-gold/20 border border-star-gold/30 rounded-lg transition-all backdrop-blur-sm text-star-gold font-medium"
          >
            Begin Your Journey
          </motion.a>
          <motion.a
            href="/sky"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all backdrop-blur-sm"
          >
            Explore the Sky
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="pt-12 space-y-4 text-sm text-gray-500"
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-medium text-white mb-1">Encrypted</div>
              <div className="text-xs">Your words stay yours</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
              <div className="text-2xl mb-2">✨</div>
              <div className="font-medium text-white mb-1">AI Analysis</div>
              <div className="text-xs">Your mood as a star</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
              <div className="text-2xl mb-2">🌌</div>
              <div className="font-medium text-white mb-1">Shared Sky</div>
              <div className="text-xs">Connect anonymously</div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

