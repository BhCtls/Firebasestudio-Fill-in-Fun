'use server';
/**
 * @fileOverview Text segmentation flow.
 *
 * - segmentText - A function that segments the input text into sentences.
 * - SegmentTextInput - The input type for the segmentText function.
 * - SegmentTextOutput - The return type for the segmentText function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SegmentTextInputSchema = z.object({
  text: z.string().describe('The English text to segment into sentences.'),
});
export type SegmentTextInput = z.infer<typeof SegmentTextInputSchema>;

const SegmentTextOutputSchema = z.object({
  sentences: z.array(z.string()).describe('The segmented sentences.'),
});
export type SegmentTextOutput = z.infer<typeof SegmentTextOutputSchema>;

export async function segmentText(input: SegmentTextInput): Promise<SegmentTextOutput> {
  return segmentTextFlow(input);
}

const segmentTextPrompt = ai.definePrompt({
  name: 'segmentTextPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The English text to segment into sentences.'),
    }),
  },
  output: {
    schema: z.object({
      sentences: z.array(z.string()).describe('The segmented sentences.'),
    }),
  },
  prompt: `You are a text segmentation expert. Your task is to segment the given text into individual sentences.\n\nText: {{{text}}}\n\nReturn the sentences as a JSON array of strings.`,
});

const segmentTextFlow = ai.defineFlow<
  typeof SegmentTextInputSchema,
  typeof SegmentTextOutputSchema
>(
  {
    name: 'segmentTextFlow',
    inputSchema: SegmentTextInputSchema,
    outputSchema: SegmentTextOutputSchema,
  },
  async input => {
    const {output} = await segmentTextPrompt(input);
    return output!;
  }
);
