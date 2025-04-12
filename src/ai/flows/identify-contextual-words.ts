'use server';
/**
 * @fileOverview An AI agent that identifies words with high contextual value in a sentence.
 *
 * - identifyContextualWords - A function that identifies contextual words in a sentence.
 * - IdentifyContextualWordsInput - The input type for the identifyContextualWords function.
 * - IdentifyContextualWordsOutput - The return type for the identifyContextualWords function.
 */

import {ai} from '@/ai/ai-instance';
import {useToast} from '@/hooks/use-toast';
import {z} from 'genkit';

const IdentifyContextualWordsInputSchema = z.object({
  sentence: z.string().describe('The sentence to analyze.'),
});
export type IdentifyContextualWordsInput = z.infer<typeof IdentifyContextualWordsInputSchema>;

const IdentifyContextualWordsOutputSchema = z.object({
  contextualWords: z.array(z.string()).describe('The words with high contextual value in the sentence.'),
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
    const {toast} = useToast();
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error: any) {
    console.error('Error in identifyContextualWordsFlow:', error);

    // Check if the error is a rate limit error
    if (error.message.includes('Too Many Requests')) {
      toast({
        title: 'Rate Limit Exceeded',
        description:
          'You have exceeded the API rate limit. Please try again later.',
        variant: 'destructive',
      });
    } else {
      // Handle other errors
      toast({
        title: 'Error',
        description: 'Failed to identify contextual words. Please try again.',
        variant: 'destructive',
      });
    }

    // Re-throw the error to prevent further execution
    throw error;
  }
});

    
