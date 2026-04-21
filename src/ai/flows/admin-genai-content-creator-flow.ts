'use server';
/**
 * @fileOverview An AI agent for generating initial drafts or suggestions for 'Rules' and 'Announcements' content for the GmailKu platform.
 *
 * - generateContentForAdmin - A function that handles the content generation process.
 * - AdminGenAIContentCreatorInput - The input type for the generateContentForAdmin function.
 * - AdminGenAIContentCreatorOutput - The return type for the generateContentForAdmin function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminGenAIContentCreatorInputSchema = z.object({
  contentType: z
    .enum(['Rules', 'Announcements'])
    .describe('The type of content to generate (Rules or Announcements).'),
  keywordsOrThemes: z
    .string()
    .describe('Keywords or themes to guide the content generation.'),
});
export type AdminGenAIContentCreatorInput = z.infer<
  typeof AdminGenAIContentCreatorInputSchema
>;

const AdminGenAIContentCreatorOutputSchema = z.object({
  generatedContent: z.string().describe('The AI-generated content draft.'),
});
export type AdminGenAIContentCreatorOutput = z.infer<
  typeof AdminGenAIContentCreatorOutputSchema
>;

export async function generateContentForAdmin(
  input: AdminGenAIContentCreatorInput
): Promise<AdminGenAIContentCreatorOutput> {
  return adminGenAIContentCreatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminGenAIContentCreatorPrompt',
  input: {schema: AdminGenAIContentCreatorInputSchema},
  output: {schema: AdminGenAIContentCreatorOutputSchema},
  prompt: `You are an AI assistant for the GmailKu platform, specializing in drafting content.
Your task is to generate a draft for either 'Rules' or 'Announcements' based on the provided keywords and themes.
Ensure the tone is appropriate for a user-facing document on the GmailKu platform and use Bahasa Indonesia.

Content Type: {{{contentType}}}
Keywords/Themes: {{{keywordsOrThemes}}}

Generate the content below:
`,
});

const adminGenAIContentCreatorFlow = ai.defineFlow(
  {
    name: 'adminGenAIContentCreatorFlow',
    inputSchema: AdminGenAIContentCreatorInputSchema,
    outputSchema: AdminGenAIContentCreatorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
