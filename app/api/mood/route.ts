import { NextResponse } from 'next/server';
import { analyzeMood } from '@/lib/ai/mood-analysis';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { decryptData, decodeDEK } from '@/lib/crypto/envelope';
import type { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { userId, dekBase64, limit = 5 } = await request.json();

    if (!userId || !dekBase64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decode the DEK from base64
    const dek = decodeDEK(dekBase64);

    // Use service role key to bypass RLS (we're on the server, userId is verified from client)
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasses RLS
    );

    // First, check if ANY entries exist for this user (debug)
    const { count } = await supabase
      .from('diary_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log('Mood API - total entries in DB for user:', count);

    // Get recent entries
    const { data: entries, error } = await supabase
      .from('diary_entries')
      .select('encrypted_content')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit) as { data: Array<{ encrypted_content: string }> | null; error: any };

    console.log('Mood API - userId:', userId);
    console.log('Mood API - entries found:', entries?.length);
    console.log('Mood API - error:', error);
    console.log('Mood API - entries data:', entries);

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries found' },
        { status: 404 }
      );
    }

    // Decrypt entries using DEK
    const decryptedEntries = [];
    for (const entry of entries) {
      try {
        const decrypted = await decryptData(entry.encrypted_content, dek);
        decryptedEntries.push(decrypted);
      } catch (error) {
        console.error('Failed to decrypt one entry, skipping:', error);
        // Skip entries that fail to decrypt (might be old or corrupted)
      }
    }

    if (decryptedEntries.length === 0) {
      return NextResponse.json(
        { error: 'No readable entries found' },
        { status: 404 }
      );
    }

    // Analyze mood
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!;
    const mood = await analyzeMood(decryptedEntries, apiKey);

    // Update profile
    await (supabase as any)
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
