import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { Langfuse } from 'langfuse';
import { Sandbox } from '@e2b/code-interpreter';

/** Next/dotenv may keep surrounding quotes from .env lines like KEY="value". Strip them for API keys. */
function normalizeEnvValue(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  return v.length > 0 ? v : undefined;
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// .chat() targets /v1/chat/completions (which OpenRouter supports), not /v1/responses.
const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: normalizeEnvValue(process.env.OPENROUTER_API_KEY),
});

const e2bApiKey = normalizeEnvValue(process.env.E2B_API_KEY);
const langfuseBaseUrl = normalizeEnvValue(
  process.env.LANGFUSE_BASE_URL ??
    process.env.LANGFUSE_HOST ??
    process.env.LANGFUSE_BASEURL,
);
const langfusePublicKey = normalizeEnvValue(process.env.LANGFUSE_PUBLIC_KEY);
const langfuseSecretKey = normalizeEnvValue(process.env.LANGFUSE_SECRET_KEY);
const hasValidLangfuseBaseUrl = !langfuseBaseUrl || /^https?:\/\//.test(langfuseBaseUrl);

const langfuse =
  langfusePublicKey &&
  langfuseSecretKey &&
  hasValidLangfuseBaseUrl
    ? new Langfuse({
        publicKey: langfusePublicKey,
        secretKey: langfuseSecretKey,
        ...(langfuseBaseUrl ? { baseUrl: langfuseBaseUrl } : {}),
      })
    : null;

langfuse?.on('error', (error) => {
  console.error('[langfuse] ingestion error:', error);
});

const searchVenuesSchema = z.object({
  location: z.string().describe('The city or region the user wants to visit'),
});

const calculateBudgetSchema = z.object({
  code: z.string().describe('Python code to execute. Use print() for the final answer.'),
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
  calculateBudget: tool({
    description:
      'Execute Python in a secure E2B sandbox for budget calculations, taxes, currency math, and complex arithmetic. Return stdout, stderr, and errors.',
    inputSchema: calculateBudgetSchema,
    execute: async ({ code }: z.infer<typeof calculateBudgetSchema>) => {
      console.log('[SERVER] Starting E2B sandbox for budget calculation...');

      if (!e2bApiKey) {
        return {
          output: '',
          stdout: [],
          stderr: [],
          error: {
            name: 'MissingE2BApiKey',
            value: 'E2B_API_KEY is not configured on the server.',
            traceback:
              'Set E2B_API_KEY in .env.local, restart the Next.js dev server, and retry the request.',
          },
        };
      }

      let sandbox: Sandbox | null = null;

      try {
        sandbox = await Sandbox.create({
          apiKey: e2bApiKey,
          requestTimeoutMs: 10_000,
          timeoutMs: 60_000,
        });

        const execution = await sandbox.runCode(code, {
          language: 'python',
          timeoutMs: 12_000,
          requestTimeoutMs: 15_000,
        });

        return {
          output: execution.text ?? execution.logs.stdout.join('\n'),
          stdout: execution.logs.stdout,
          stderr: execution.logs.stderr,
          error: execution.error
            ? {
                name: execution.error.name,
                value: execution.error.value,
                traceback: execution.error.traceback,
              }
            : null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isForbidden = message.includes('403') || message.includes('Forbidden');

        if (isForbidden) {
          console.error(
            '[SERVER] E2B rejected sandbox creation with 403 Forbidden. Check E2B_API_KEY and restart the dev server.',
          );
        } else {
          console.error('[SERVER] E2B budget calculation failed:', message);
        }

        return {
          output: '',
          stdout: [],
          stderr: [],
          error: {
            name: 'BudgetCalculationError',
            value: message,
            traceback: message.includes('403')
              ? 'E2B rejected the sandbox request with 403 Forbidden. Check that E2B_API_KEY is valid, belongs to an active E2B account/project, and restart the Next.js dev server after editing .env.local.'
              : 'The secure Python sandbox failed or timed out. Explain this to the user and ask them to retry.',
          },
        };
      } finally {
        if (sandbox) {
          try {
            await sandbox.kill({ requestTimeoutMs: 5_000 });
          } catch (error) {
            console.error('[SERVER] Failed to kill E2B sandbox:', error);
          }
        }
      }
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
    system: "You are an elite corporate offsite planner for Seminaire.com. Your job is to help the user design their perfect team retreat. Always use the searchVenues tool to find actual locations before recommending anything. If the user asks for budget calculations, taxes, currency math, or complex arithmetic, write Python and use the calculateBudget tool. Do not do budget math in your head.",
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
