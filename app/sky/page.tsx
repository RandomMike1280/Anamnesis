'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { generateStarPosition, getMoodColor } from '@/lib/utils';
import type { Star } from '@/types';
import { StarSky3D } from '@/components/sky/StarSky3D';
import { Modal } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SkyPage() {
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStars();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          loadStars();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStars = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, bio, quote, region, mood, mood_color')
        .not('mood', 'is', null);

      if (error) throw error;

      const starsData: Star[] = data.map((profile) => {
        const position = generateStarPosition(profile.region || undefined);
        return {
          id: profile.id,
          username: profile.username,
          bio: profile.bio,
          quote: profile.quote,
          region: profile.region,
          mood: profile.mood as any,
          color: profile.mood_color || getMoodColor(profile.mood || 'happy'),
          x: position.x,
          y: position.y,
        };
      });

      setStars(starsData);
    } catch (error) {
      console.error('Error loading stars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (star: Star) => {
    setSelectedStar(star);
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 left-6 right-6 z-10 flex justify-between items-center"
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-6 py-3">
          <h1 className="text-2xl font-serif text-glow bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Space of Sonder
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {stars.length} souls wandering the cosmos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push('/diary')}>
            My Diary
          </Button>
          <Button variant="ghost" onClick={() => router.push('/messages')}>
            Messages
          </Button>
        </div>
      </motion.div>

      {/* 3D Star Sky */}
      <StarSky3D stars={stars} onStarClick={handleStarClick} />

      {/* Star Detail Modal */}
      <Modal
        isOpen={!!selectedStar}
        onClose={() => setSelectedStar(null)}
        title={selectedStar?.username || 'Anonymous Star'}
      >
        {selectedStar && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full relative"
                style={{
                  backgroundColor: selectedStar.color,
                  boxShadow: `0 0 40px ${selectedStar.color}, 0 0 80px ${selectedStar.color}40`,
                }}
              >
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: selectedStar.color }} />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <p className="text-sm text-gray-400 capitalize">
                  Feeling <span className="text-white font-medium">{selectedStar.mood}</span>
                </p>
              </div>

              {selectedStar.region && (
                <p className="text-xs text-gray-500">
                  📍 {selectedStar.region}
                </p>
              )}
            </div>

            {selectedStar.quote && (
              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Current thought</p>
                <p className="italic text-gray-200 leading-relaxed">&ldquo;{selectedStar.quote}&rdquo;</p>
              </div>
            )}

            {selectedStar.bio && (
              <div>
                <p className="text-sm text-gray-400 mb-2">About this soul</p>
                <p className="text-gray-300 leading-relaxed">{selectedStar.bio}</p>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  router.push(`/messages?to=${selectedStar.id}`);
                }}
              >
                Send Message
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedStar(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

