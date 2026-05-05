import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { Langfuse } from 'langfuse';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// .chat() targets /v1/chat/completions (which OpenRouter supports), not /v1/responses.
const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const langfuse =
  process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY
    ? new Langfuse({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        baseUrl: process.env.LANGFUSE_BASEURL ?? process.env.LANGFUSE_HOST,
      })
    : null;

const searchVenuesSchema = z.object({
  location: z.string().describe('The city or region the user wants to visit'),
});

const venueTools = {
  searchVenues: tool({
    description: 'Search the database for offsite venues based on location',
    inputSchema: searchVenuesSchema,
    execute: async (args: z.infer<typeof searchVenuesSchema>) => {
      console.log(`[SERVER] AI is searching Convex for venues in: ${args.location}`);

      const searchVenuesRef = (
        (api as { venues?: { searchVenues?: unknown } }).venues?.searchVenues ??
        'venues:searchVenues'
      ) as Parameters<typeof convex.query>[0];

      const venues = await convex.query(searchVenuesRef, { location: args.location });

      return JSON.parse(JSON.stringify({
        resultsFound: venues?.length || 0,
        venues: venues
      }));
    },
  }),
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  // openrouter/free is OpenRouter's auto-router that selects an available free model.
  // The model can be overridden via the OPENROUTER_MODEL env var.
  const modelId = process.env.OPENROUTER_MODEL ?? 'openrouter/free';
  const sessionId = req.headers.get('x-session-id') ?? 'offsite-concierge-local';
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openRouter.chat(modelId),
    messages: modelMessages,
    system: "You are an elite corporate offsite planner for Seminaire.com. Your job is to help the user design their perfect team retreat. Always use the searchVenues tool to find actual locations before recommending anything.",
    maxRetries: 2,
    stopWhen: stepCountIs(5),
    tools: venueTools,
    onError: ({ error }) => {
      const e = error as { statusCode?: number; message?: string };
      console.error(`[chat] model "${modelId}" failed (${e.statusCode ?? '?'}): ${e.message ?? error}`);
    },
    onFinish: async ({ text, totalUsage, finishReason, steps, model }) => {
      if (!langfuse) return;

      try {
        const trace = langfuse.trace({
          name: 'Offsite-Concierge-Chat',
          sessionId,
          input: messages,
          output: text,
          metadata: {
            finishReason,
            modelProvider: model.provider,
            stepCount: steps.length,
          },
        });

        trace.generation({
          name: 'chat-completion',
          model: model.modelId,
          input: modelMessages,
          output: text,
          usageDetails: {
            input: totalUsage.inputTokens ?? 0,
            output: totalUsage.outputTokens ?? 0,
            total: totalUsage.totalTokens ?? 0,
          },
        });

        await langfuse.flushAsync();
      } catch (error) {
        console.error('[langfuse] failed to log chat trace:', error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
