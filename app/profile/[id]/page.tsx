'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LoadingPage } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { getMoodColor } from '@/lib/utils';
import {
  HeartIcon,
  EditIcon,
  MailIcon,
  CheckCircleIcon,
  XIcon,
  ImageIcon,
  MailHeartIcon,
} from '@/components/ui/icons';

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  quote: string | null;
  status: string | null;
  region: string | null;
  mood: string | null;
  mood_color: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_discord: string | null;
  contact_twitter: string | null;
  love_letters_posted: number;
  likes: number;
  created_at?: string;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    status: '',
    contact_email: '',
    contact_discord: '',
    contact_twitter: '',
  });

  useEffect(() => {
    loadProfile();
    checkCurrentUser();
  }, [profileId]);

  async function checkCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      const profileData: Profile = {
        ...data,
        username: data.username || `soul_${profileId.slice(0, 8)}`,
        love_letters_posted: data.love_letters_posted || 0,
        likes: data.likes || 0,
      };

      setProfile(profileData);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        status: data.status || '',
        contact_email: data.contact_email || '',
        contact_discord: data.contact_discord || '',
        contact_twitter: data.contact_twitter || '',
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: likeData } = await supabase
          .from('profile_likes')
          .select('id')
          .eq('profile_id', profileId)
          .eq('user_id', user.id)
          .single();
        setHasLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike() {
    if (!currentUser) { router.push('/auth'); return; }
    try {
      if (hasLiked) {
        await supabase.from('profile_likes').delete()
          .eq('profile_id', profileId).eq('user_id', currentUser.id);
        await supabase.rpc('decrement_profile_likes', { profile_id: profileId });
        setHasLiked(false);
        setProfile(p => p ? { ...p, likes: p.likes - 1 } : null);
      } else {
        await supabase.from('profile_likes').insert({ profile_id: profileId, user_id: currentUser.id });
        await supabase.rpc('increment_profile_likes', { profile_id: profileId });
        setHasLiked(true);
        setProfile(p => p ? { ...p, likes: p.likes + 1 } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async function saveProfile() {
    if (!currentUser || currentUser.id !== profileId) return;
    try {
      const { error } = await supabase.from('profiles').update(editForm).eq('id', profileId);
      if (error) throw error;
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  }

  async function uploadFile(type: 'avatar' | 'banner', file: File) {
    if (!currentUser || currentUser.id !== profileId) return;
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${profileId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('profile-media').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('profile-media').getPublicUrl(filePath);
      const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
      await supabase.from('profiles').update({ [updateField]: data.publicUrl }).eq('id', profileId);
      loadProfile();
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  }

  const isOwnProfile = currentUser?.id === profileId;

  if (loading) return <LoadingPage />;
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center text-white bg-black">
      Profile not found
    </div>
  );

  const displayName = profile.display_name || profile.username;
  const handle = profile.username || `soul_${profileId.slice(0, 8)}`;
  const moodColor = profile.mood_color || getMoodColor(profile.mood || 'hopeful');
  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-5 left-5 z-30"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2"
        >
          ← Back
        </button>
      </motion.div>

      {/* Banner */}
      <div className="relative h-52 w-full overflow-hidden">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0d1117] via-[#131a2a] to-[#0d1117]" />
        )}
        {isOwnProfile && (
          <>
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading === 'banner'}
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg text-sm hover:bg-black/90 transition-all"
            >
              <ImageIcon size={15} />
              {uploading === 'banner' ? 'Uploading…' : 'Change Banner'}
            </button>
            <input ref={bannerInputRef} type="file" accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadFile('banner', e.target.files[0])}
              className="hidden" />
          </>
        )}
      </div>

      {/* Avatar row */}
      <div className="max-w-2xl mx-auto px-5">
        <div className="flex items-end justify-between -mt-14 mb-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-black bg-[#1c1c2e] overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName || 'Avatar'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white select-none">
                  {(displayName || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading === 'avatar'}
                  className="absolute bottom-1 right-1 p-1.5 bg-black/90 border border-white/20 rounded-full hover:bg-black transition-all"
                  title="Change avatar"
                >
                  <ImageIcon size={14} />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadFile('avatar', e.target.files[0])}
                  className="hidden" />
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mb-1">
            {!isOwnProfile && (
              <>
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    hasLiked
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                      : 'bg-transparent border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  <HeartIcon size={16} filled={hasLiked} />
                  {profile.likes}
                </button>
                <button
                  onClick={() => router.push(`/messages?to=${profileId}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-all"
                >
                  <MailIcon size={16} />
                  Message
                </button>
              </>
            )}
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/5 transition-all"
              >
                <EditIcon size={15} />
                Edit Profile
              </button>
            )}
            {isOwnProfile && editing && (
              <>
                <button
                  onClick={() => { setEditing(false); loadProfile(); }}
                  className="px-4 py-2 rounded-full text-sm border border-white/20 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-all"
                >
                  <CheckCircleIcon size={15} />
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name + handle + mood */}
        <div className="mb-4">
          {editing ? (
            <input
              value={editForm.display_name}
              onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              placeholder="Display name"
              className="text-2xl font-bold bg-transparent border-b border-white/20 text-white w-full mb-1 focus:outline-none focus:border-violet-400"
            />
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              {profile.mood && (
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${moodColor}18`,
                    borderColor: `${moodColor}40`,
                    color: moodColor,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: moodColor }} />
                  <span className="capitalize">{profile.mood}</span>
                </span>
              )}
            </div>
          )}
          <p className="text-gray-500 text-sm mt-0.5">@{handle}</p>
        </div>

        {/* Meta info row */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          {joinedDate && <span>📅 Joined {joinedDate}</span>}
          {profile.region && <span>📍 {profile.region}</span>}
        </div>

        {/* Stats row */}
        <div className="flex gap-5 text-sm mb-5 border-b border-white/10 pb-5">
          <span>
            <span className="font-bold text-white">{profile.likes}</span>
            <span className="text-gray-500 ml-1">Likes</span>
          </span>
          <span>
            <span className="font-bold text-white">{profile.love_letters_posted}</span>
            <span className="text-gray-500 ml-1">Love Letters</span>
          </span>
        </div>

        {/* Status */}
        {(editing || profile.status) && (
          <div className="mb-5">
            {editing ? (
              <input
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                placeholder="What's on your mind?"
                maxLength={100}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
              />
            ) : (
              <p className="text-gray-300 italic text-sm">&ldquo;{profile.status}&rdquo;</p>
            )}
          </div>
        )}

        {/* Bio */}
        {(editing || profile.bio) && (
          <div className="mb-5">
            {editing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself…"
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-sm"
              />
            ) : (
              <p className="text-gray-300 leading-relaxed text-sm">{profile.bio}</p>
            )}
          </div>
        )}

        {/* Contact fields (edit mode only unless values exist) */}
        {(editing || profile.contact_email || profile.contact_discord || profile.contact_twitter) && (
          <div className="border-t border-white/10 pt-5 mb-5 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Contact</p>
            {(editing || profile.contact_email) && (
              editing ? (
                <input type="email" value={editForm.contact_email}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                  placeholder="Email"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              ) : (
                <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
                  ✉️ {profile.contact_email}
                </a>
              )
            )}
            {(editing || profile.contact_discord) && (
              editing ? (
                <input value={editForm.contact_discord}
                  onChange={(e) => setEditForm({ ...editForm, contact_discord: e.target.value })}
                  placeholder="Discord (username)"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              ) : (
                <p className="text-sm text-gray-300">💬 {profile.contact_discord}</p>
              )
            )}
            {(editing || profile.contact_twitter) && (
              editing ? (
                <input value={editForm.contact_twitter}
                  onChange={(e) => setEditForm({ ...editForm, contact_twitter: e.target.value })}
                  placeholder="Twitter / X (@username)"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              ) : (
                <a
                  href={`https://x.com/${profile.contact_twitter.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                >
                  𝕏 {profile.contact_twitter}
                </a>
              )
            )}
          </div>
        )}

        {/* Love Letters section */}
        <div className="border-t border-white/10 pt-6 pb-16">
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <MailHeartIcon size={18} className="text-pink-400" />
            Love Letters
          </h2>

          {profile.love_letters_posted === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <MailHeartIcon size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-base">
                This person hasn&apos;t left any love letters yet.
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => router.push('/wall')}
                  className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Leave your first letter →
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              {profile.love_letters_posted} letter{profile.love_letters_posted !== 1 ? 's' : ''} left on the wall.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
