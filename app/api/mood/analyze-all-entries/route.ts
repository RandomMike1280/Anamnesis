import { NextResponse } from 'next/server';
import { analyzeMood } from '@/lib/ai/mood-analysis';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { decryptData, decodeDEK } from '@/lib/crypto/envelope';
import type { Database } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { userId, dekBase64 } = await request.json();

    if (!userId || !dekBase64) {
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

    // Get all entries without mood data
    const { data: entries, error } = await supabase
      .from('diary_entries')
      .select('id, encrypted_content, entry_date')
      .eq('user_id', userId)
      .is('mood', null) as { data: any[] | null; error: any };

    if (error) throw error;

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        message: 'No entries to analyze',
        analyzed: 0,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!;
    let analyzed = 0;

    // Analyze each entry individually
    for (const entry of entries) {
      try {
        // Decrypt entry content
        const decryptedContent = await decryptData(entry.encrypted_content, dek);

        // Analyze mood for this entry
        const mood = await analyzeMood([decryptedContent], apiKey);

        // Update the entry with mood data
        await supabase
          .from('diary_entries')
          .update({
            mood: mood.mood,
            mood_color: mood.color_hex,
            mood_confidence: mood.confidence,
          })
          .eq('id', entry.id);

        analyzed++;
      } catch (error) {
        console.error(`Error analyzing entry ${entry.id}:`, error);
        // Continue with next entry
      }
    }

    return NextResponse.json({
      message: `Successfully analyzed ${analyzed} entries`,
      analyzed,
      total: entries.length,
    });
  } catch (error: any) {
    console.error('Error analyzing entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze entries' },
      { status: 500 }
    );
  }
}
