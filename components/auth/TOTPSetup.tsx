'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { generateTOTPSecret, generateTOTPUri, verifyTOTP } from '@/lib/crypto/totp';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XIcon } from '@/components/ui/icons';

interface TOTPSetupProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export function TOTPSetup({ userId, userEmail, onClose }: TOTPSetupProps) {
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Generate TOTP secret and QR code
    const totpSecret = generateTOTPSecret();
    setSecret(totpSecret);

    const uri = generateTOTPUri(totpSecret, userEmail);
    // Use Google Charts API for QR code (simple, no dependencies)
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(uri)}`;
    setQrCodeUrl(qrUrl);
  }, [userEmail]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      const isValid = await verifyTOTP(verificationCode, secret);

      if (!isValid) {
        setError('Invalid code. Please try again.');
        setLoading(false);
        return;
      }

      // Save TOTP secret to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          totp_secret: secret,
          totp_enabled: true,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setVerified(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error enabling TOTP:', err);
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <XIcon size={20} />
          </button>

          {!verified ? (
            <>
              <h2 className="text-xl font-bold mb-4">Set Up Authenticator App</h2>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400 mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.):
                  </p>
                  <div className="flex justify-center bg-white p-4 rounded-lg">
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Can't scan? Enter this key manually:
                  </p>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                    <code className="text-sm text-gray-300 font-mono break-all select-all">
                      {secret}
                    </code>
                  </div>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Enter the 6-digit code from your app:
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                      autoFocus
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
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircleIcon size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">2FA Enabled!</h3>
              <p className="text-sm text-gray-400">
                Your account is now protected with two-factor authentication.
              </p>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
