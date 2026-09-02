'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { encrypt, decrypt } from '@/lib/crypto/encryption';
import { getRelativeTime } from '@/lib/utils';
import type { Message } from '@/types';
import { LoadingPage } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import { MailIcon, LockIcon, UnlockIcon, ImageIcon, PaperclipIcon, TrashIcon, EditIcon, XIcon } from '@/components/ui/icons';

export function MessagesContent() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [password, setPassword] = useState('');
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
        loadMessages(toUser);
      }
    }
  }, [user, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      .is('deleted_at', null)
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
        } else {
          decrypted.push({
            id: msg.id,
            senderId: msg.sender_id,
            recipientId: msg.recipient_id,
            content: '[Encrypted - Enter password to view]',
            createdAt: new Date(msg.created_at),
            readAt: msg.read_at ? new Date(msg.read_at) : null,
            mediaUrl: msg.media_url,
            mediaType: msg.media_type,
            editedAt: msg.edited_at ? new Date(msg.edited_at) : null,
            deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : null,
          });
        }
      } catch {
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

    setMessages(decrypted);
  }

  async function sendMessage(mediaUrl?: string, mediaType?: string) {
    if ((!newMessage.trim() && !mediaUrl) || !password || !selectedConversation || !user) return;

    setSending(true);
    try {
      const encrypted = await encrypt(newMessage || '[Media]', password);
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', msgId);

      if (error) throw error;

      if (selectedConversation) loadMessages(selectedConversation);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  }

  async function saveEdit(msgId: string) {
    if (!editText.trim() || !password) return;

    try {
      const encrypted = await encrypt(editText, password);
      const { error } = await (supabase as any)
        .from('messages')
        .update({
          encrypted_content: encrypted,
          edited_at: new Date().toISOString(),
        })
        .eq('id', msgId);

      if (error) throw error;

      setEditingId(null);
      setEditText('');
      if (selectedConversation) loadMessages(selectedConversation);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  }

  if (loading) return <LoadingPage />;

  const selectedProfile = conversations.find((c) => c.id === selectedConversation);

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

      {/* Password unlock modal overlay */}
      {!password && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                <LockIcon size={40} className="text-amber-400" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-white mb-2">Messages are encrypted</p>
              <p className="text-sm text-gray-400 mb-4">Enter your password to decrypt</p>
              <input
                type="password"
                placeholder="Password"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && password && selectedConversation) {
                    loadMessages(selectedConversation);
                  }
                }}
                className="w-full px-5 py-3 bg-black/60 border border-white/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>
          </motion.div>
        </motion.div>
      )}

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
                    if (password) loadMessages(conv.id);
                  }}
                  className={`
                    w-full p-3.5 rounded-xl text-left transition-all flex items-center gap-3
                    ${selectedConversation === conv.id
                      ? 'bg-white/15 text-white'
                      : 'text-gray-400 hover:bg-white/8 hover:text-white'
                    }
                  `}
                >
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-violet-300">
                      {conv.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.username}</p>
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
          {selectedConversation && password ? (
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-[#0f131c]/50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                    <span className="text-base font-bold text-violet-300">
                      {selectedProfile?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selectedProfile?.username}</p>
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
