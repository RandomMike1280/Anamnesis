'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { generateDEK, encryptDEK, encodeDEK } from '@/lib/crypto/envelope';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { LockIcon } from '@/components/ui/icons';

interface PINSetupProps {
  userId: string;
  onComplete: (pin: string, dek: Uint8Array) => void;
}

export function PINSetup({ userId, onComplete }: PINSetupProps) {
  const [pin, setPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate PIN
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    if (pin !== confirmPIN) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      // Generate a random DEK
      const dek = generateDEK();

      // Encrypt DEK with PIN
      const encryptedDEKString = await encryptDEK(dek, pin);

      // Store encrypted DEK in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ encrypted_dek: encryptedDEKString })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Pass DEK to parent (kept in memory for this session)
      onComplete(pin, dek);
    } catch (err: any) {
      console.error('Error setting up PIN:', err);
      setError(err.message || 'Failed to set up PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
              <LockIcon size={32} className="text-violet-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Set Up Your PIN</h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Your diary entries are encrypted with a separate PIN for extra security.
            This PIN is <strong>not</strong> your account password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Enter PIN (6+ digits)
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPIN(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                maxLength={12}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Confirm PIN
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPIN}
                onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                maxLength={12}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 text-center"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || !pin || !confirmPIN}
            >
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-200">
              ⚠️ <strong>Important:</strong> If you forget your PIN, your diary entries cannot be recovered.
              Write it down in a safe place.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
