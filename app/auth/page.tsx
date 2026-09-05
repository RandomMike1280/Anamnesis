'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { verifyTOTP } from '@/lib/crypto/totp';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { WarningIcon } from '@/components/ui/icons';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsTOTP, setNeedsTOTP] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Check if user has TOTP enabled
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('totp_enabled')
            .eq('id', data.user.id)
            .single();

          if (profile?.totp_enabled) {
            // Need TOTP verification
            setPendingUserId(data.user.id);
            setNeedsTOTP(true);
            setLoading(false);
            return;
          }
        }

        router.push('/diary');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Update profile with username
        if (data.user) {
          await (supabase as any)
            .from('profiles')
            .update({ username })
            .eq('id', data.user.id);
        }

        router.push('/diary');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!pendingUserId) throw new Error('No user ID');

      // Get user's TOTP secret
      const { data: profile } = await supabase
        .from('profiles')
        .select('totp_secret')
        .eq('id', pendingUserId)
        .single();

      if (!profile?.totp_secret) throw new Error('TOTP not configured');

      // Verify the code
      const isValid = await verifyTOTP(totpCode, profile.totp_secret);

      if (!isValid) {
        throw new Error('Invalid authentication code');
      }

      // TOTP verified, proceed to diary
      router.push('/diary');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-star-gold/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-star-blue/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-star-teal/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-serif mb-3 bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent"
          >
            Space of Sonder
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            {isLogin ? 'Welcome back to your constellation' : 'Begin your journey among the stars'}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          {needsTOTP ? (
            <form onSubmit={handleTOTPVerify} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-xl font-medium text-white mb-2">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-400">Enter the 6-digit code from your authenticator app</p>
              </div>

              <Input
                label="Authentication Code"
                type="text"
                inputMode="numeric"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                className="bg-white/5 text-center text-2xl tracking-widest"
                maxLength={6}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="secondary"
                className="w-full py-4 text-lg bg-gradient-to-r from-star-gold/20 to-star-gold/10 hover:from-star-gold/30 hover:to-star-gold/20 border-star-gold/40"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-star-gold/30 border-t-star-gold rounded-full animate-spin mr-2" />
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setNeedsTOTP(false);
                  setPendingUserId(null);
                  setTotpCode('');
                  setError('');
                }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back to sign in
              </button>
            </form>
          ) : (
            <div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      label="Username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your cosmic alias"
                      required
                      className="bg-white/5"
                    />
                  </motion.div>
                )}

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-white/5"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/5"
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full py-4 text-lg bg-gradient-to-r from-star-gold/20 to-star-gold/10 hover:from-star-gold/30 hover:to-star-gold/20 border-star-gold/40"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-star-gold/30 border-t-star-gold rounded-full animate-spin mr-2" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </span>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Create one"
                    : 'Already have an account? Sign in'}
                </button>
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400/80 text-center space-y-1"
                >
                  <div className="text-yellow-400 font-medium mb-1 flex items-center justify-center gap-1.5">
                    <WarningIcon size={14} /> Important
                  </div>
                  <p>Your password encrypts all diary entries.</p>
                  <p>If you lose it, your data cannot be recovered.</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6"
        >
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}

