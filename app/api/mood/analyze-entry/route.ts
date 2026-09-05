import { NextResponse } from 'next/server';
import { analyzeMood } from '@/lib/ai/mood-analysis';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { decryptData, decodeDEK } from '@/lib/crypto/envelope';
import type { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { entryId, userId, dekBase64 } = await request.json();

    if (!entryId || !userId || !dekBase64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decode the DEK from base64
    const dek = decodeDEK(dekBase64);

    // Use service role key to bypass RLS
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the specific entry
    const { data: entry, error } = await supabase
      .from('diary_entries')
      .select('id, encrypted_content, entry_date')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single() as { data: any; error: any };

    if (error) throw error;

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Decrypt entry content
    const decryptedContent = await decryptData(entry.encrypted_content, dek);

    // Analyze mood for this single entry
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!;
    const mood = await analyzeMood([decryptedContent], apiKey);

    // Update the entry with mood data
    await supabase
      .from('diary_entries')
      .update({
        mood: mood.mood,
        mood_color: mood.color_hex,
        mood_confidence: mood.confidence,
      })
      .eq('id', entryId);

    return NextResponse.json(mood);
  } catch (error: any) {
    console.error('Error analyzing entry mood:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze entry mood' },
      { status: 500 }
    );
  }
}
