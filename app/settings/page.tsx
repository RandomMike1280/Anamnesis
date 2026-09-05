'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { TOTPSetup } from '@/components/auth/TOTPSetup';
import { LoadingPage } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { ShieldIcon, CheckCircleIcon } from '@/components/ui/icons';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/auth');
      return;
    }
    setUser(authUser);

    // Check if TOTP is enabled
    const { data: profile } = await supabase
      .from('profiles')
      .select('totp_enabled')
      .eq('id', authUser.id)
      .single();

    setTotpEnabled(profile?.totp_enabled || false);
    setLoading(false);
  }

  async function disableTOTP() {
    if (!confirm('Disable two-factor authentication? This will make your account less secure.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ totp_enabled: false, totp_secret: null })
        .eq('id', user.id);

      if (error) throw error;

      setTotpEnabled(false);
      alert('Two-factor authentication disabled');
    } catch (err) {
      console.error('Error disabling TOTP:', err);
      alert('Failed to disable 2FA');
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0d12]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/diary')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-serif">Security Settings</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Two-Factor Authentication Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <ShieldIcon size={24} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-white mb-2">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Add an extra layer of security by requiring a code from your authenticator app when signing in.
                </p>

                {totpEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircleIcon size={16} />
                      <span>Two-factor authentication is enabled</span>
                    </div>
                    <Button
                      onClick={disableTOTP}
                      variant="secondary"
                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    >
                      Disable 2FA
                    </Button>
                  </div>
                ) : showTOTPSetup ? (
                  <div className="mt-4">
                    <TOTPSetup
                      userId={user.id}
                      onComplete={() => {
                        setTotpEnabled(true);
                        setShowTOTPSetup(false);
                      }}
                    />
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowTOTPSetup(true)}
                    variant="secondary"
                    className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    Enable 2FA
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
            <p className="font-medium mb-1">Recommended Apps:</p>
            <ul className="text-blue-400/80 space-y-0.5">
              <li>• Google Authenticator</li>
              <li>• Authy</li>
              <li>• Microsoft Authenticator</li>
              <li>• Any TOTP-compatible app</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
