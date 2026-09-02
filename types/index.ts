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
