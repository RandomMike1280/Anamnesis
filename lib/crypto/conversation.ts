// Shared conversation key management
// Each conversation between two users has a unique encryption key that both can access

import { encryptData, decryptData } from './envelope';

/**
 * Derive a deterministic conversation key from two user IDs
 * Both users will get the same key regardless of order
 */
export async function deriveConversationKey(userId1: string, userId2: string): Promise<Uint8Array> {
  // Sort the IDs to ensure consistent order
  const [id1, id2] = [userId1, userId2].sort();

  // Combine the IDs with a salt
  const combined = `conversation:${id1}:${id2}`;

  // Hash to create a key
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return new Uint8Array(hashBuffer);
}

/**
 * Get the conversation key for communicating with another user
 * This key is derived deterministically from both user IDs
 */
export async function getConversationKey(
  supabase: any,
  userId: string,
  otherUserId: string,
  userDEK: Uint8Array
): Promise<Uint8Array> {
  // Derive the conversation key from both user IDs
  return await deriveConversationKey(userId, otherUserId);
}

