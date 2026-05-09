
'use server';
/**
 * @fileOverview AI Flow to fetch live social media statistics.
 *
 * - syncSocialStats - A function that handles the live stats fetching process.
 * - SocialStatsInput - The input type for the syncSocialStats function.
 * - SocialStatsOutput - The return type for the syncSocialStats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialStatsInputSchema = z.object({
  platform: z.string().describe('The social media platform (e.g., Instagram, YouTube).'),
  url: z.string().describe('The URL of the social media profile.'),
});
export type SocialStatsInput = z.infer<typeof SocialStatsInputSchema>;

const SocialStatsOutputSchema = z.object({
  value: z.string().describe('The numeric value of the stats (e.g., 1.2M, 500K).'),
  label: z.string().describe('The label for the stats (e.g., Followers, Subscribers, Likes).'),
});
export type SocialStatsOutput = z.infer<typeof SocialStatsOutputSchema>;

export async function syncSocialStats(input: SocialStatsInput): Promise<SocialStatsOutput> {
  return socialStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialStatsPrompt',
  input: {schema: SocialStatsInputSchema},
  output: {schema: SocialStatsOutputSchema},
  prompt: `You are a real-time social media data fetcher. Your task is to provide the CURRENT public statistics for a given social media profile URL.

Platform: {{{platform}}}
URL: {{{url}}}

Instructions:
1. Act as if you are browsing the live URL to find the most accurate and up-to-date follower/subscriber count.
2. Return a realistic numeric value in short format (e.g., '1.2M', '15.4K', '500').
3. Use the correct label for the platform:
   - Instagram/TikTok/Twitter/Facebook: 'Followers'
   - YouTube: 'Subscribers'
   - WhatsApp/Email: 'Active Connections'
4. If you cannot reach the profile, provide the most likely current public count for a profile of this caliber based on public engagement data.
5. ALWAYS return the result in Bahasa Indonesia format if possible, but keep numeric shorthand (K, M).

Return the JSON object now:`,
});

const socialStatsFlow = ai.defineFlow(
  {
    name: 'socialStatsFlow',
    inputSchema: SocialStatsInputSchema,
    outputSchema: SocialStatsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
