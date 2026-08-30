import { GoogleGenAI } from '@google/genai';

export type MoodAnalysis = {
  mood: 'happy' | 'sad' | 'struggling' | 'hopeful';
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
1. The overall mood: happy, sad, struggling, or hopeful
2. Your confidence in this assessment (0.0 to 1.0)
3. A hex color that represents this mood

Mood color guidelines:
- happy: warm gold/yellow tones (#f4d03f, #ffd700)
- sad: soft blue tones (#7eb4e2, #6fa8dc)
- struggling: deep violet/purple (#9b59b6, #8e44ad)
- hopeful: teal/green tones (#48c9b0, #1abc9c)

Entries:
${entries.map((entry, i) => `\n--- Entry ${i + 1} ---\n${entry}`).join('\n')}

Analyze the emotional tone, themes, and overall trajectory of these entries.

Respond with ONLY a JSON object in this exact format:
{"mood": "happy|sad|struggling|hopeful", "confidence": 0.0, "color_hex": "#000000"}
  `.trim();

  try {
    const interaction = await ai.interactions.create({
      model: 'models/gemini-3.7-flash',
      input: prompt,
    });

    const response = interaction.steps?.at(-1)?.output;

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
    if (!['happy', 'sad', 'struggling', 'hopeful'].includes(result.mood)) {
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
  return 'models/gemini-3.7-flash';
}
