import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod'; // Zod comes pre-installed with Next.js, it helps validate data
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// Connect securely to your Convex database
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    // Upgrade to the smarter, currently free Llama 3.3 model
    model: openRouter('meta-llama/llama-3.3-70b-instruct:free'),
    messages: await convertToModelMessages(messages),
    system: "You are an elite corporate offsite planner for Seminaire.com. Your job is to help the user design their perfect team retreat. Always use the searchVenues tool to find actual locations before recommending anything.",
    
    // THE MAGIC: Giving the AI hands to search the database
    tools: {
      searchVenues: tool({
        description: 'Search the database for offsite venues based on location',
        // Define what the AI needs to provide to run the search
        inputSchema: z.object({
          location: z.string().describe('The city or region the user wants to visit'),
        }),
        // The actual function that runs when the AI decides to use this tool
        execute: async ({ location }) => {
          console.log(`AI is searching Convex for venues in: ${location}`);
          // Query your Convex database
          // Generated Convex API types may be stale during local setup; fall back to function path string.
          const searchVenuesRef = (
            (api as { venues?: { searchVenues?: unknown } }).venues?.searchVenues ??
            'venues:searchVenues'
          ) as Parameters<typeof convex.query>[0];
          const venues = await convex.query(searchVenuesRef, { location });
          return venues;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}