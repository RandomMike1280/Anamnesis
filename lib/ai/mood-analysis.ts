import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export type MoodAnalysis = {
  mood: 'happy' | 'sad' | 'struggling' | 'hopeful';
  confidence: number;
  color_hex: string;
};

const moodSchema = {
  type: SchemaType.OBJECT,
  properties: {
    mood: {
      type: SchemaType.STRING,
      enum: ['happy', 'sad', 'struggling', 'hopeful'],
      description: 'The overall emotional state detected from the diary entries',
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Confidence score between 0.0 and 1.0',
    },
    color_hex: {
      type: SchemaType.STRING,
      description: 'Hex color code representing the mood',
    },
  },
  required: ['mood', 'confidence', 'color_hex'],
};

/**
 * Analyze mood from diary entries using Gemini Flash
 */
export async function analyzeMood(entries: string[]): Promise<MoodAnalysis> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: moodSchema,
    },
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
  `.trim();

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  return JSON.parse(response) as MoodAnalysis;
}

/**
 * Get the latest model ID from Google AI
 * Flash Lite versions update frequently - check Google AI Studio for current ID
 */
export function getModelId(): string {
  return 'gemini-2.0-flash-lite';
}
