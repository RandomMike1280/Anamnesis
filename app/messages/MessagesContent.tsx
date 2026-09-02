'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { encrypt, decrypt } from '@/lib/crypto/encryption';
import { formatTimestamp, getRelativeTime } from '@/lib/utils';
import type { Message } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import { motion } from 'framer-motion';

export function MessagesContent() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      const toUser = searchParams.get('to');
      if (toUser) {
        setSelectedConversation(toUser);
        loadMessages(toUser);
      }
    }
  }, [user, searchParams]);

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/auth');
      return;
    }
    setUser(authUser);
    loadConversations(authUser.id);
    setLoading(false);
  }

  async function loadConversations(userId: string) {
    const { data, error } = await (supabase as any)
      .from('messages')
      .select('sender_id, recipient_id')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    const conversationIds = new Set<string>();
    data?.forEach((msg: any) => {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      conversationIds.add(otherId);
    });

    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, username')
      .in('id', Array.from(conversationIds));

    setConversations(profiles || []);
  }

  async function loadMessages(recipientId: string) {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const decrypted = [];
    for (const msg of data || []) {
      try {
        if (password) {
          const content = await decrypt(msg.encrypted_content, password);
          decrypted.push({ ...msg, content });
        } else {
          decrypted.push({ ...msg, content: '[Encrypted - Enter password to view]' });
        }
      } catch {
        decrypted.push({ ...msg, content: '[Failed to decrypt]' });
      }
    }

    setMessages(decrypted);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !password || !selectedConversation || !user) return;

    setSending(true);
    try {
      const encrypted = await encrypt(newMessage, password);
      const { error } = await (supabase as any)
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          encrypted_content: encrypted,
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-deep via-[#0f1419] to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/sky')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Sky
          </button>
        </div>

        <h1 className="text-4xl font-serif font-bold text-white mb-8 text-center">
          Messages
        </h1>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Enter password to decrypt messages"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    loadMessages(conv.id);
                  }}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors
                    ${selectedConversation === conv.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }
                  `}
                >
                  {conv.username}
                </button>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-2">
            {selectedConversation ? (
              <>
                <div className="h-96 overflow-y-auto mb-4 space-y-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-3 rounded-lg max-w-[80%]
                        ${msg.senderId === user.id
                          ? 'ml-auto bg-star-blue/20 text-white'
                          : 'mr-auto bg-white/10 text-gray-300'
                        }
                      `}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getRelativeTime(new Date(msg.createdAt))}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={sending || !password}>
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select a conversation to view messages
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
