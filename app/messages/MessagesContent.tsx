'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { encryptData, decryptData, decryptDEK } from '@/lib/crypto/envelope';
import { getConversationKey } from '@/lib/crypto/conversation';
import { getRelativeTime } from '@/lib/utils';
import type { Message } from '@/types';
import { LoadingPage } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import { MailIcon, LockIcon, UnlockIcon, ImageIcon, PaperclipIcon, TrashIcon, EditIcon, XIcon } from '@/components/ui/icons';

export function MessagesContent() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [dek, setDEK] = useState<Uint8Array | null>(null);
  const [conversationKey, setConversationKey] = useState<Uint8Array | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      const toUser = searchParams.get('to');
      if (toUser) {
        setSelectedConversation(toUser);
        // Find the profile for this user
        const profile = conversations.find(c => c.id === toUser);
        if (profile) setSelectedProfile(profile);
        loadMessages(toUser);
      }
    }
  }, [user, searchParams, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!user || !selectedConversation) return;

    console.log('Setting up real-time subscription for conversation:', selectedConversation);
    console.log('User ID:', user.id);

    const channel = supabase
      .channel(`messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔔 Real-time message INSERT received:', payload);
          const msg = payload.new as any;
          console.log('Message details - sender:', msg.sender_id, 'recipient:', msg.recipient_id);
          console.log('Current user:', user.id, 'Current conversation:', selectedConversation);
          // Check if this message is for the current conversation
          if (
            (msg.sender_id === user.id && msg.recipient_id === selectedConversation) ||
            (msg.sender_id === selectedConversation && msg.recipient_id === user.id)
          ) {
            console.log('✅ Message is for current conversation, reloading...');
            loadMessages(selectedConversation);
          } else {
            console.log('❌ Message is NOT for current conversation, ignoring');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔔 Real-time message UPDATE received:', payload);
          const msg = payload.new as any;
          // Check if this message is for the current conversation
          if (
            (msg.sender_id === user.id && msg.recipient_id === selectedConversation) ||
            (msg.sender_id === selectedConversation && msg.recipient_id === user.id)
          ) {
            console.log('✅ Updated message is for current conversation, reloading...');
            loadMessages(selectedConversation);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔔 Real-time message DELETE received:', payload);
          loadMessages(selectedConversation);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

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
      .select('id, username, display_name, avatar_url')
      .in('id', Array.from(conversationIds));

    setConversations(profiles || []);
  }

  async function loadMessages(recipientId: string) {
    if (!user) {
      console.log('Cannot load messages: user missing');
      return;
    }

    // Get conversation key (derived from both user IDs, no DEK needed)
    let convKey: Uint8Array;
    try {
      convKey = await getConversationKey(supabase, user.id, recipientId, new Uint8Array());
      setConversationKey(convKey);
    } catch (error) {
      console.error('Error getting conversation key:', error);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    console.log('Loaded messages from DB:', data?.length, 'messages');

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const decrypted = [];
    for (const msg of data || []) {
      try {
        const content = await decryptData(msg.encrypted_content, convKey);
        decrypted.push({
          id: msg.id,
          senderId: msg.sender_id,
          recipientId: msg.recipient_id,
          content,
          createdAt: new Date(msg.created_at),
          readAt: msg.read_at ? new Date(msg.read_at) : null,
          mediaUrl: msg.media_url,
          mediaType: msg.media_type,
          editedAt: msg.edited_at ? new Date(msg.edited_at) : null,
          deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : null,
        });
      } catch (err) {
        console.error('Failed to decrypt message:', msg.id, err);
        decrypted.push({
          id: msg.id,
          senderId: msg.sender_id,
          recipientId: msg.recipient_id,
          content: '[Failed to decrypt]',
          createdAt: new Date(msg.created_at),
          readAt: msg.read_at ? new Date(msg.read_at) : null,
          mediaUrl: null,
          mediaType: null,
          editedAt: null,
          deletedAt: null,
        });
      }
    }

    console.log('Decrypted messages:', decrypted.length);
    setMessages(decrypted);

    // Scroll to bottom after messages load
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, 100);
  }

  async function sendMessage(mediaUrl?: string, mediaType?: string) {
    if ((!newMessage.trim() && !mediaUrl) || !selectedConversation || !user) return;

    setSending(true);
    try {
      // Get conversation key if we don't have it yet
      let convKey = conversationKey;
      if (!convKey) {
        convKey = await getConversationKey(supabase, user.id, selectedConversation, new Uint8Array());
        setConversationKey(convKey);
      }

      // Only encrypt the actual message text, use empty string for media-only messages
      const contentToEncrypt = mediaUrl && !newMessage.trim() ? '' : newMessage;
      const encrypted = await encryptData(contentToEncrypt, convKey);
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          encrypted_content: encrypted,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('message-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('message-media')
        .getPublicUrl(fileName);

      const mediaType = file.type.startsWith('image/') ? 'image' :
                       file.type.startsWith('video/') ? 'video' :
                       file.type.startsWith('audio/') ? 'audio' : 'file';

      await sendMessage(urlData.publicUrl, mediaType);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteMessage(msgId: string) {
    if (!confirm('Delete this message? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', msgId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Message deleted, reloading...');
      if (selectedConversation) {
        await loadMessages(selectedConversation);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  }

  async function saveEdit(msgId: string) {
    if (!editText.trim() || !conversationKey) return;

    try {
      const encrypted = await encryptData(editText, conversationKey);
      const { error } = await supabase
        .from('messages')
        .update({
          encrypted_content: encrypted,
          edited_at: new Date().toISOString(),
        })
        .eq('id', msgId);

      if (error) {
        console.error('Edit error:', error);
        throw error;
      }

      console.log('Message edited, reloading...');
      setEditingId(null);
      setEditText('');
      if (selectedConversation) {
        await loadMessages(selectedConversation);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  }

  async function handlePinUnlock() {
    if (!pinInput || !user) return;
    setPinError('');

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('encrypted_dek')
        .eq('id', user.id)
        .single();

      if (!profile?.encrypted_dek) {
        setPinError('No encryption key found');
        return;
      }

      const decryptedDEK = await decryptDEK(profile.encrypted_dek, pinInput);
      setDEK(decryptedDEK);
      setShowPinPrompt(false);
      setPinInput('');

      // Load messages for selected conversation if any
      if (selectedConversation) {
        loadMessages(selectedConversation);
      }
    } catch (err) {
      console.error('PIN unlock error:', err);
      setPinError('Incorrect PIN');
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="h-screen bg-[#0a0d12] text-white flex flex-col overflow-hidden">

      {/* Top nav bar - fixed height */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-[#0a0d12]/95 backdrop-blur-sm flex items-center justify-between z-10">
        <button
          onClick={() => router.push('/sky')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Sky
        </button>
        <div className="flex items-center gap-3">
          <MailIcon size={20} className="text-gray-400" />
          <h1 className="text-lg font-serif">Messages</h1>
        </div>
        <div className="w-24" />
      </div>

      {/* Main content - takes remaining height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - fixed width, scrollable */}
        <div className="w-80 flex-shrink-0 border-r border-white/10 bg-[#0f131c] flex flex-col">
          <div className="flex-shrink-0 px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Conversations
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    setSelectedProfile(conv);
                    router.push(`/messages?to=${conv.id}`);
                    loadMessages(conv.id);
                  }}
                  className={`
                    w-full p-3.5 rounded-xl text-left transition-all flex items-center gap-3
                    ${selectedConversation === conv.id
                      ? 'bg-white/15 text-white'
                      : 'text-gray-400 hover:bg-white/8 hover:text-white'
                    }
                  `}
                >
                  {conv.avatar_url ? (
                    <img
                      src={conv.avatar_url}
                      alt={conv.display_name || conv.username}
                      className="w-10 h-10 flex-shrink-0 rounded-full object-cover border border-violet-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-violet-300">
                        {(conv.display_name || conv.username)?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.display_name || conv.username || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 truncate">Tap to view</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-20 px-4 text-gray-500 space-y-2">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Visit someone&apos;s star to start chatting</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area - takes remaining width, scrollable messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-[#0f131c]/50">
                <div className="flex items-center gap-3">
                  {selectedProfile?.avatar_url ? (
                    <img
                      src={selectedProfile.avatar_url}
                      alt={selectedProfile.display_name || selectedProfile.username}
                      className="w-11 h-11 rounded-full object-cover border border-violet-500/30"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                      <span className="text-base font-bold text-violet-300">
                        {(selectedProfile?.display_name || selectedProfile?.username)?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{selectedProfile?.display_name || selectedProfile?.username || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">End-to-end encrypted</p>
                  </div>
                </div>
              </div>

              {/* Messages scrollable area */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.senderId === user.id;
                  const isEditing = editingId === msg.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`
                            px-4 py-3 rounded-2xl
                            ${isOwn
                              ? 'bg-gradient-to-br from-violet-600/40 to-purple-600/30 border border-violet-500/30 text-white rounded-br-md'
                              : 'bg-white/10 border border-white/10 text-gray-200 rounded-bl-md'
                            }
                          `}
                        >
                          {msg.mediaUrl && (
                            <div className="mb-2">
                              {msg.mediaType === 'image' && (
                                <img src={msg.mediaUrl} alt="Shared image" className="max-w-full max-h-96 rounded-lg" />
                              )}
                              {msg.mediaType === 'video' && (
                                <video src={msg.mediaUrl} controls className="max-w-full max-h-96 rounded-lg" />
                              )}
                              {msg.mediaType === 'audio' && (
                                <audio src={msg.mediaUrl} controls className="max-w-full" />
                              )}
                              {msg.mediaType === 'file' && (
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-300 hover:text-violet-200 underline">
                                  <PaperclipIcon size={16} /> Download file
                                </a>
                              )}
                            </div>
                          )}
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveEdit(msg.id);
                                  if (e.key === 'Escape') { setEditingId(null); setEditText(''); }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 bg-black/40 border border-white/20 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(msg.id)} className="text-xs text-green-400 hover:text-green-300">Save</button>
                                <button onClick={() => { setEditingId(null); setEditText(''); }} className="text-xs text-gray-400 hover:text-gray-300">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                            {getRelativeTime(msg.createdAt)}
                            {msg.editedAt && <span>(edited)</span>}
                          </p>
                        </div>
                        {isOwn && !isEditing && (
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingId(msg.id); setEditText(msg.content); }}
                              className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                              title="Edit"
                            >
                              <EditIcon size={12} className="text-gray-400" />
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-1.5 rounded bg-white/10 hover:bg-red-500/30 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon size={12} className="text-gray-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar - fixed at bottom */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-[#0f131c]/80 backdrop-blur-sm">
                <div className="flex gap-3 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,audio/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-shrink-0 p-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
                    title="Attach media"
                  >
                    {uploading ? (
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-400" />
                    )}
                  </button>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message... (Shift+Enter for newline)"
                    rows={1}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 transition-all text-sm max-h-32"
                    style={{ fieldSizing: 'content' } as any}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={sending || (!newMessage.trim() && !uploading)}
                    className="flex-shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <UnlockIcon size={48} className="text-gray-600" />
                  </div>
                </div>
                <p className="text-base">
                  {!selectedConversation
                    ? 'Select a conversation to start'
                    : 'Enter your password to decrypt messages'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
