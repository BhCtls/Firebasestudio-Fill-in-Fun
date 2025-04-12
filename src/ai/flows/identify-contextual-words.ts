'use server';

/**
 * @fileOverview An AI agent that identifies words with high contextual value in a sentence.
 *
 * - identifyContextualWords - A function that identifies contextual words in a sentence.
 * - IdentifyContextualWordsInput - The input type for the identifyContextualWords function.
 * - IdentifyContextualWordsOutput - The return type for the identifyContextualWords function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const IdentifyContextualWordsInputSchema = z.object({
  sentence: z.string().describe('The sentence to analyze.'),
});
export type IdentifyContextualWordsInput = z.infer<typeof IdentifyContextualWordsInputSchema>;

const IdentifyContextualWordsOutputSchema = z.object({
  contextualWords: z.array(z.string()).describe('The words with high contextual value in the sentence.')
});
export type IdentifyContextualWordsOutput = z.infer<typeof IdentifyContextualWordsOutputSchema>;

export async function identifyContextualWords(
  input: IdentifyContextualWordsInput
): Promise<IdentifyContextualWordsOutput> {
  return identifyContextualWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyContextualWordsPrompt',
  input: {
    schema: z.object({
      sentence: z.string().describe('The sentence to analyze.'),
    }),
  },
  output: {
    schema: z.object({
      contextualWords: z
        .array(z.string())
        .describe('The words with high contextual value in the sentence.'),
    }),
  },
  prompt: `You are an AI expert in linguistics.
Your task is to identify words with high contextual value in a given sentence.
These words are crucial for understanding the meaning of the sentence.
Return a list of these words.

Sentence: {{{sentence}}}

Contextual Words:`, // Ensure correct Handlebars syntax
});

const identifyContextualWordsFlow = ai.defineFlow<
  typeof IdentifyContextualWordsInputSchema,
  typeof IdentifyContextualWordsOutputSchema
>({
  name: 'identifyContextualWordsFlow',
  inputSchema: IdentifyContextualWordsInputSchema,
  outputSchema: IdentifyContextualWordsOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
