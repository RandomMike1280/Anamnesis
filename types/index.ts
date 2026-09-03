export interface DiaryEntry {
  id: string;
  userId: string;
  content: string; // Decrypted content
  createdAt: Date;
  updatedAt: Date;
  entryDate: Date;
}

export interface UserProfile {
  id: string;
  username: string | null;
  bio: string | null;
  quote: string | null;
  region: string | null;
  mood: 'happy' | 'sad' | 'struggling' | 'hopeful' | null;
  moodColor: string | null;
  moodConfidence: number | null;
  lastMoodUpdate: Date | null;
  encrypted_dek: string | null; // Envelope encryption: DEK encrypted with PIN
  entry_count: number; // Number of diary entries (for star size)
  totp_secret: string | null; // TOTP secret for authenticator app
  totp_enabled: boolean; // Whether TOTP is enabled
}

export interface Star {
  id: string;
  username: string | null;
  bio: string | null;
  quote: string | null;
  region: string | null;
  mood: 'happy' | 'sad' | 'struggling' | 'hopeful';
  color: string;
  x: number; // Position in sky (0-1)
  y: number; // Position in sky (0-1)
  entry_count?: number; // Number of diary entries (affects star size)
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string; // Decrypted content
  createdAt: Date;
  readAt: Date | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'audio' | 'file' | null;
  editedAt?: Date | null;
  deletedAt?: Date | null;
}
