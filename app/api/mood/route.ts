import { NextResponse } from 'next/server';
import { analyzeMood } from '@/lib/ai/mood-analysis';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto/encryption';

export async function POST(request: Request) {
  try {
    const { userId, password, limit = 5 } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get recent entries
    const { data: entries, error } = await supabase
      .from('diary_entries')
      .select('encrypted_content')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries found' },
        { status: 404 }
      );
    }

    // Decrypt entries
    const decryptedEntries = await Promise.all(
      entries.map(async (entry) => {
        try {
          return await decrypt(entry.encrypted_content, password);
        } catch {
          throw new Error('Failed to decrypt entries - wrong password?');
        }
      })
    );

    // Analyze mood
    const mood = await analyzeMood(decryptedEntries);

    // Update profile
    await supabase
      .from('profiles')
      .update({
        mood: mood.mood,
        mood_color: mood.color_hex,
        mood_confidence: mood.confidence,
        last_mood_update: new Date().toISOString(),
      })
      .eq('id', userId);

    return NextResponse.json(mood);
  } catch (error: any) {
    console.error('Error analyzing mood:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze mood' },
      { status: 500 }
    );
  }
}
