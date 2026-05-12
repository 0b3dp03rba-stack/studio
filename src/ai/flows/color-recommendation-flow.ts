
'use server';
/**
 * @fileOverview AI Flow to recommend matching secondary colors for a premium neon aesthetic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColorRecommendationInputSchema = z.object({
  primaryColor: z.string().describe('The primary hex color (e.g., #ff0000).'),
  palette: z.array(z.string()).optional().describe('A list of extracted colors from the user profile picture.'),
});
export type ColorRecommendationInput = z.infer<typeof ColorRecommendationInputSchema>;

const ColorRecommendationOutputSchema = z.object({
  secondaryColor: z.string().describe('The recommended matching secondary hex color.'),
  explanation: z.string().describe('Short explanation of the choice.'),
});
export type ColorRecommendationOutput = z.infer<typeof ColorRecommendationOutputSchema>;

export async function getAIColorRecommendation(input: ColorRecommendationInput): Promise<ColorRecommendationOutput> {
  return colorRecommendationFlow(input);
}

const colorRecommendationFlow = ai.defineFlow(
  {
    name: 'colorRecommendationFlow',
    inputSchema: ColorRecommendationInputSchema,
    outputSchema: ColorRecommendationOutputSchema,
  },
  async (input) => {
    const paletteContext = input.palette && input.palette.length > 0 
      ? `Berikut adalah palet warna yang diekstrak dari foto profil user: ${input.palette.join(', ')}.`
      : '';

    const { output } = await ai.generate({
      prompt: `You are a master UI designer specialized in High-Contrast Neon and Minecraft aesthetics.
      
      Primary Color: ${input.primaryColor}
      ${paletteContext}
      
      Tugas Anda:
      1. Berikan warna sekunder (secondaryColor) dalam format HEX.
      2. Prioritas Utama: Cari warna sekunder yang ada di dalam palet warna yang diberikan (jika ada palet) yang menciptakan harmoni atau kontras terbaik dengan Primary Color.
      3. Jika palet warna terlalu gelap, hanya berisi satu warna, atau tidak ada warna yang cocok, buatlah warna sekunder baru yang sangat kontras dan memberikan efek "neon glow".
      4. Warna sekunder harus membuat gradasi yang mewah.
      
      Return the result as JSON with secondaryColor (hex) and a short explanation in Bahasa Indonesia.`,
      output: { schema: ColorRecommendationOutputSchema },
    });
    return output!;
  }
);
