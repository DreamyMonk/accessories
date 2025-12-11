'use server';

/**
 * @fileOverview Implements a fuzzy accessory search flow using an LLM to suggest potential matches or alternative search terms when no exact matches are found.
 *
 * - fuzzyAccessorySearch - A function that handles the fuzzy accessory search process.
 * - FuzzyAccessorySearchInput - The input type for the fuzzyAccessorySearch function.
 * - FuzzyAccessorySearchOutput - The return type for the fuzzyAccessorySearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FuzzyAccessorySearchInputSchema = z.object({
  searchTerm: z.string().describe('The search term entered by the user, which may include a brand, model, and accessory type.'),
});
export type FuzzyAccessorySearchInput = z.infer<typeof FuzzyAccessorySearchInputSchema>;

const FuzzyAccessorySearchOutputSchema = z.object({
  suggestedMatches: z.array(
    z.string().describe('Potential accessory matches based on the search term.')
  ).describe('A list of suggested accessory matches.'),
  alternativeSearchTerms: z.array(
    z.string().describe('Alternative search terms that the user could try.')
  ).describe('A list of alternative search terms.'),
  recommendFollowUp: z.boolean().describe('Suggest user to ask follow up questions if no results are found'),
});
export type FuzzyAccessorySearchOutput = z.infer<typeof FuzzyAccessorySearchOutputSchema>;

export async function fuzzyAccessorySearch(input: FuzzyAccessorySearchInput): Promise<FuzzyAccessorySearchOutput> {
  return fuzzyAccessorySearchFlow(input);
}

const fuzzyAccessorySearchPrompt = ai.definePrompt({
  name: 'fuzzyAccessorySearchPrompt',
  input: {schema: FuzzyAccessorySearchInputSchema},
  output: {schema: FuzzyAccessorySearchOutputSchema},
  prompt: `You are an expert in mobile accessories and their compatibility with different phone models.

  The user has searched for: "{{searchTerm}}".  No exact matches were found.

  Based on the user's search term, suggest potential accessory matches that are similar, and alternative search terms that might yield better results. For example, if the user searched for a phone model and an accessory, you could suggest different variations of the model name or related accessories.

  If you cannot find any relevant suggestions, set recommendFollowUp to true.

  Return the results in the following JSON format:
  {
    "suggestedMatches": ["match1", "match2", ...],
    "alternativeSearchTerms": ["term1", "term2", ...],
    "recommendFollowUp": true/false
  }`,
});

const fuzzyAccessorySearchFlow = ai.defineFlow(
  {
    name: 'fuzzyAccessorySearchFlow',
    inputSchema: FuzzyAccessorySearchInputSchema,
    outputSchema: FuzzyAccessorySearchOutputSchema,
  },
  async input => {
    const {output} = await fuzzyAccessorySearchPrompt(input);
    return output!;
  }
);
