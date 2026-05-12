'use server';
/**
 * @fileOverview AI Flow to recommend matching secondary colors for a premium neon aesthetic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColorRecommendationInputSchema = z.object({
  primaryColor: z.string().describe('The primary hex color (e.g., #ff0000).'),
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
    const { output } = await ai.generate({
      prompt: `You are a master UI designer specialized in High-Contrast Neon and Minecraft aesthetics.
      Given the primary color: ${input.primaryColor}, suggest a prestigious, high-vibrancy secondary color that creates a stunning neon gradient.
      The secondary color must be distinct and create a "glow" effect.
      
      Return the result as JSON with secondaryColor (hex) and a short explanation in Bahasa Indonesia.`,
      output: { schema: ColorRecommendationOutputSchema },
    });
    return output!;
  }
);
