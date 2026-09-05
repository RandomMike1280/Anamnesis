'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { generateStarPosition, getMoodColor } from '@/lib/utils';
import type { Star } from '@/types';
import { StarSky3D } from '@/components/sky/StarSky3D';
import { StarSparkle } from '@/components/sky/StarSparkle';
import { Modal } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HeartIcon, ZapIcon, FrownIcon, ThumbsUpIcon, HugIcon, SparkleIcon } from '@/components/ui/icons';

export default function SkyPage() {
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [loading, setLoading] = useState(true);
  const [reaction, setReaction] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const router = useRouter();

  const reactions = [
    { Icon: HeartIcon, label: 'Love' },
    { Icon: ZapIcon, label: 'Wow' },
    { Icon: FrownIcon, label: 'Sad' },
    { Icon: ThumbsUpIcon, label: 'Like' },
    { Icon: HugIcon, label: 'Hug' },
    { Icon: SparkleIcon, label: 'Inspire' },
  ];

  useEffect(() => {
    loadCurrentUser();
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

  const loadCurrentUser = async () => {
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
  };

  const loadStars = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, quote, region, mood, mood_color, entry_count')
        .not('mood', 'is', null) as { data: any[] | null; error: any };

      if (error) throw error;

      const starsData: Star[] = (data || []).map((profile: any) => {
        const position = generateStarPosition(profile.region || undefined, profile.id);
        const displayName = profile.display_name || profile.username || `soul_${profile.id.slice(0, 8)}`;
        return {
          id: profile.id,
          username: displayName,
          bio: profile.bio,
          quote: profile.quote,
          region: profile.region,
          mood: profile.mood as any,
          color: profile.mood_color || getMoodColor(profile.mood || 'happy'),
          x: position.x,
          y: position.y,
          entry_count: profile.entry_count || 0,
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/timeline')}>
            Timeline
          </Button>
          <Button variant="ghost" onClick={() => router.push('/wall')}>
            Love Wall
          </Button>
          <Button variant="ghost" onClick={() => router.push('/diary')}>
            My Diary
          </Button>
          <Button variant="ghost" onClick={() => router.push('/messages')}>
            Messages
          </Button>
          {currentUser && (
            <button
              onClick={() => router.push(`/profile/${currentUser.id}`)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/10 border border-white/20 hover:border-white/40 transition-all flex items-center justify-center text-white font-semibold overflow-hidden"
              title="Profile"
            >
              {currentProfile?.avatar_url ? (
                <img src={currentProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">
                  {(currentProfile?.display_name || currentProfile?.username || 'U')[0].toUpperCase()}
                </span>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* 3D Star Sky */}
      <StarSky3D stars={stars} onStarClick={handleStarClick} />

      {/* Star Detail Modal */}
      <Modal
        isOpen={!!selectedStar}
        onClose={() => setSelectedStar(null)}
        title={selectedStar?.username || 'Wandering Soul'}
      >
        {selectedStar && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-32 h-32 relative"
              >
                <StarSparkle color={selectedStar.color} size={80} />
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
                  {selectedStar.region}
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

            {/* Reactions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-3">Send a reaction</p>
              <div className="flex gap-2 flex-wrap">
                {reactions.map((r) => (
                  <motion.button
                    key={r.label}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setReaction(r.label);
                      setTimeout(() => setReaction(null), 2000);
                    }}
                    title={r.label}
                    className={`
                      px-4 py-2 rounded-lg text-gray-300 transition-all
                      ${reaction === r.label ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    <r.Icon size={22} />
                  </motion.button>
                ))}
              </div>
              {reaction && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-emerald-400 mt-3 text-center"
                >
                  {reaction} reaction sent!
                </motion.p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  router.push(`/profile/${selectedStar.id}`);
                }}
              >
                View Profile
              </Button>
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

