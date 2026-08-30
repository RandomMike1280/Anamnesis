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

export default function MessagesPage() {
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

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);
    loadConversations(user.id);
  };

  const loadConversations = async (userId: string) => {
    try {
      // Get unique conversations - just get IDs first
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, recipient_id')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique conversation partners
      const partnerIds = new Set<string>();
      data?.forEach((msg: any) => {
        const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        partnerIds.add(partnerId);
      });

      // Fetch profile info for each partner
      if (partnerIds.size > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', Array.from(partnerIds));

        if (profileError) throw profileError;

        setConversations(profiles?.map(p => ({
          id: p.id,
          username: p.username || 'Anonymous'
        })) || []);
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      console.error('Error details:', error?.message, error?.code, error?.details);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (partnerId: string) => {
    if (!user || !password) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => {
          try {
            const content = await decrypt(msg.encrypted_content, password);
            return {
              id: msg.id,
              senderId: msg.sender_id,
              recipientId: msg.recipient_id,
              content,
              createdAt: new Date(msg.created_at),
              readAt: msg.read_at ? new Date(msg.read_at) : null,
            };
          } catch {
            return {
              id: msg.id,
              senderId: msg.sender_id,
              recipientId: msg.recipient_id,
              content: '[Failed to decrypt]',
              createdAt: new Date(msg.created_at),
              readAt: msg.read_at ? new Date(msg.read_at) : null,
            };
          }
        })
      );

      setMessages(decryptedMessages);

      // Mark as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', partnerId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !password || !user || !selectedConversation) return;

    setSending(true);
    try {
      const encryptedContent = await encrypt(newMessage, password);

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: selectedConversation,
        encrypted_content: encryptedContent,
      });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-white/10 p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-serif">Messages</h1>
          <Button variant="ghost" onClick={() => router.push('/sky')}>
            Sky
          </Button>
        </div>

        {!password && (
          <Card>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password to decrypt"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </Card>
        )}

        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setSelectedConversation(conv.id);
                loadMessages(conv.id);
              }}
              className={`
                w-full text-left px-4 py-3 rounded-lg transition-colors
                ${selectedConversation === conv.id
                  ? 'bg-white/10'
                  : 'bg-white/5 hover:bg-white/8'}
              `}
            >
              <p className="font-medium">{conv.username}</p>
            </button>
          ))}

          {conversations.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No conversations yet. Visit the sky to message someone.
            </p>
          )}
        </div>
      </div>

      {/* Main - Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-md px-4 py-3 rounded-lg
                        ${isMine
                          ? 'bg-star-gold/20 border border-star-gold/30'
                          : 'bg-white/5 border border-white/10'}
                      `}
                    >
                      <p className="text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {getRelativeTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Input */}
            {password && (
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
