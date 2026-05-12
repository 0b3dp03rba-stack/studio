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
      ? `Berikut adalah palet warna asli dari foto profil user: ${input.palette.join(', ')}.`
      : '';

    const { output } = await ai.generate({
      prompt: `You are a master UI designer specialized in High-Contrast Neon aesthetics.
      
      Primary Color yang dipilih user: ${input.primaryColor}
      ${paletteContext}
      
      Tugas Anda:
      1. Berikan warna sekunder (secondaryColor) dalam format HEX.
      2. PRIORITAS UTAMA: Cari warna di dalam "palet warna asli" yang memberikan harmoni atau kontras mewah dengan Primary Color. 
      3. Contoh: Jika user memilih Biru dan di palet ada warna Perak/Putih/Abu-abu cerah, PILIH warna tersebut karena itu menciptakan kesan "clean" dan "premium" daripada memilih warna kuning yang acak.
      4. Jika palet warna asli tidak memiliki warna yang cocok (semua terlalu gelap atau terlalu mirip), barulah buat warna sekunder baru yang kontras tinggi (Neon).
      5. Warna sekunder harus membuat gradasi yang terlihat profesional dan mahal.
      
      Return the result as JSON with secondaryColor (hex) and a short explanation in Bahasa Indonesia.`,
      output: { schema: ColorRecommendationOutputSchema },
    });
    return output!;
  }
);
