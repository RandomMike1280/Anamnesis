'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { generateStarPosition, getMoodColor } from '@/lib/utils';
import type { Star } from '@/types';
import { StarSky } from '@/components/sky/StarSky';
import { Modal } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';

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
      <div className="fixed top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif text-glow">Space of Sonder</h1>
          <p className="text-sm text-gray-400">{stars.length} stars in the sky</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push('/diary')}>
            My Diary
          </Button>
          <Button variant="ghost" onClick={() => router.push('/messages')}>
            Messages
          </Button>
        </div>
      </div>

      {/* Star Sky */}
      <StarSky stars={stars} onStarClick={handleStarClick} />

      {/* Star Detail Modal */}
      <Modal
        isOpen={!!selectedStar}
        onClose={() => setSelectedStar(null)}
        title={selectedStar?.username || 'Anonymous Star'}
      >
        {selectedStar && (
          <div className="space-y-4">
            <div
              className="w-16 h-16 rounded-full mx-auto star-glow"
              style={{
                backgroundColor: selectedStar.color,
                filter: `drop-shadow(0 0 12px ${selectedStar.color})`,
              }}
            />

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400 capitalize">
                Feeling {selectedStar.mood}
              </p>

              {selectedStar.region && (
                <p className="text-xs text-gray-500">
                  📍 {selectedStar.region}
                </p>
              )}
            </div>

            {selectedStar.quote && (
              <div className="border-l-2 border-white/20 pl-4 py-2">
                <p className="italic text-gray-300">&ldquo;{selectedStar.quote}&rdquo;</p>
              </div>
            )}

            {selectedStar.bio && (
              <div>
                <p className="text-sm text-gray-400 mb-2">About</p>
                <p className="text-gray-300">{selectedStar.bio}</p>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  router.push(`/messages?to=${selectedStar.id}`);
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
