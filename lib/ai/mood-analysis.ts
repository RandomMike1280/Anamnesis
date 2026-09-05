import { GoogleGenAI } from '@google/genai';

export type MoodType =
  | 'joyful' | 'content' | 'peaceful' | 'excited' | 'grateful'
  | 'sad' | 'melancholic' | 'lonely' | 'heartbroken' | 'grieving'
  | 'anxious' | 'stressed' | 'overwhelmed' | 'frustrated' | 'angry'
  | 'hopeful' | 'optimistic' | 'determined' | 'inspired' | 'curious'
  | 'numb' | 'confused' | 'restless' | 'tired' | 'apathetic'
  | 'scared' | 'worried' | 'nervous' | 'vulnerable' | 'uncertain';

export type MoodAnalysis = {
  mood: MoodType;
  confidence: number;
  color_hex: string;
};

/**
 * Analyze mood from diary entries using Google GenAI
 * This should only be called server-side
 */
export async function analyzeMood(entries: string[], apiKey: string): Promise<MoodAnalysis> {
  const ai = new GoogleGenAI({
    apiKey,
  });
  const prompt = `
You are analyzing diary entries to determine the writer's current emotional state.

Read these recent diary entries and determine:
1. The overall mood from this expanded list: joyful, content, peaceful, excited, grateful, sad, melancholic, lonely, heartbroken, grieving, anxious, stressed, overwhelmed, frustrated, angry, hopeful, optimistic, determined, inspired, curious, numb, confused, restless, tired, apathetic, scared, worried, nervous, vulnerable, uncertain
2. Your confidence in this assessment (0.0 to 1.0)
3. A hex color that represents this mood

Mood color guidelines:
- Positive/Uplifting (joyful, content, peaceful, excited, grateful): warm gold/yellow/coral tones (#FFD700, #FFA500, #FF6B6B, #FFB347)
- Sad/Melancholic (sad, melancholic, lonely, heartbroken, grieving): cool blue/indigo tones (#6FA8DC, #4A90E2, #5B7C99, #7EB4E2)
- Anxious/Stressed (anxious, stressed, overwhelmed, frustrated, angry): deep red/maroon/crimson (#C0392B, #E74C3C, #8B0000, #DC143C)
- Hopeful/Growth (hopeful, optimistic, determined, inspired, curious): teal/green/mint tones (#1ABC9C, #48C9B0, #2ECC71, #27AE60)
- Numb/Neutral (numb, confused, restless, tired, apathetic): gray/muted tones (#95A5A6, #7F8C8D, #BDC3C7, #A9B7C0)
- Fear/Uncertainty (scared, worried, nervous, vulnerable, uncertain): violet/purple tones (#9B59B6, #8E44AD, #6C5CE7, #A29BFE)

Entries:
${entries.map((entry, i) => `\n--- Entry ${i + 1} ---\n${entry}`).join('\n')}

Analyze the emotional tone, themes, and overall trajectory of these entries. Choose the mood that most accurately captures the dominant emotional state.

Respond with ONLY a JSON object in this exact format:
{"mood": "one_of_the_moods_above", "confidence": 0.0, "color_hex": "#000000"}
  `.trim();

  try {
    const interaction = await ai.interactions.create({
      model: 'models/gemini-3.5-flash-lite',
      input: prompt,
    });

    // `output_text` is the SDK-provided concatenated text of the last model
    // output; `steps` is not populated on interactions.create responses.
    const response = interaction.output_text;

    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]) as MoodAnalysis;

    // Validate the result
    const validMoods: MoodType[] = [
      'joyful', 'content', 'peaceful', 'excited', 'grateful',
      'sad', 'melancholic', 'lonely', 'heartbroken', 'grieving',
      'anxious', 'stressed', 'overwhelmed', 'frustrated', 'angry',
      'hopeful', 'optimistic', 'determined', 'inspired', 'curious',
      'numb', 'confused', 'restless', 'tired', 'apathetic',
      'scared', 'worried', 'nervous', 'vulnerable', 'uncertain'
    ];

    if (!validMoods.includes(result.mood)) {
      throw new Error('Invalid mood returned');
    }

    return result;
  } catch (error) {
    console.error('Error analyzing mood:', error);
    // Return a default mood if analysis fails
    return {
      mood: 'hopeful',
      confidence: 0.5,
      color_hex: '#48c9b0',
    };
  }
}

/**
 * Get the current model ID
 */
export function getModelId(): string {
  return 'models/gemini-3.5-flash-lite';
}
