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
  model: z.string().describe('The model to use for the analysis.'),
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
      model: z.string().describe('The model to use for the analysis.'),
    }),
  },
  output: {
    schema: z.object({
      contextualWords: z
        .array(z.string())
        .describe('The words with high contextual value in the sentence.'),
    }),
  },
  prompt: `You are an AI English teacher and linguistic.To make your Chinese students master the transformation of verbs and adjectives
Your task is to identify words with high contextual value in a given sentence.
These words are verbs and adjectives.Avoid Nouns.
Return a list of these words.

Model: {{{model}}}
Sentence: {{{sentence}}}

Contextual Words:`,
});

const ChangeTenseInputSchema = z.object({
  word: z.string().describe('The word to change tense.'),
  tense: z.string().describe('The target tense for the word.'),
  context: z.string().describe('The context sentence of the word'),
  model: z.string().describe('The model to use for the analysis.'),
});
export type ChangeTenseInput = z.infer<typeof ChangeTenseInputSchema>;

const ChangeTenseOutputSchema = z.object({
  changedWord: z.string().describe('The changed tense word.')
});
export type ChangeTenseOutput = z.infer<typeof ChangeTenseOutputSchema>;

const prompt_changetense = ai.definePrompt({
  name: 'changeTensePrompt',
  input: {
    schema: z.object({
      word: z.string().describe('The word to change tense.'),
      tense: z.string().describe('The target tense for the word.'),
      context: z.string().describe('The context sentence of the word'),
      model: z.string().describe('The model to use for the analysis.'),
    }),
  },
  output: {
    schema: z.object({
      changedWord: z.string().describe('The changed tense word.'),
    }),
  },
  prompt: `You are an AI expert in linguistics.
Your task is to change the tense(for verb) or form(for adjectives or adverbs) of the given word to the target tense or form, with the context sentence provided.
When you get a verb like "to be done",you can output a "do".Also you can convert an adjective such as "collective" to "collect" or "collection".
Just output the changed tense word, nothing else.

Model: {{{model}}}
Word: {{{word}}}
Tense: {{{tense}}}
Context Sentence: {{{context}}}

Changed Tense Word:`,
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

const changeTenseFlow = ai.defineFlow<
  typeof ChangeTenseInputSchema,
  typeof ChangeTenseOutputSchema
>({
  name: 'changeTenseFlow',
  inputSchema: ChangeTenseInputSchema,
  outputSchema: ChangeTenseOutputSchema,
},
async input => {
    try {
        const {output} = await prompt_changetense(input);
        return output!;
    } catch (error: any) {
        console.error("Error in changeTenseFlow:", error);
        // Return a default value or re-throw the error, depending on your needs
        return { changedWord: '' }; // Returning an empty string as default
    }
});

export async function changeTense(input: ChangeTenseInput): Promise<ChangeTenseOutput> {
  return changeTenseFlow(input);
}
