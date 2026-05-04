import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// We override the default OpenAI configuration to point to our OpenRouter Gateway
const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  // Extract the chat history from the frontend request
  const { messages } = await req.json();

  // Call the AI model and stream the response
  const result = await streamText({
    model: openRouter('meta-llama/llama-3-8b-instruct:free'),
    messages,
    system: "You are an elite corporate offsite planner for Seminaire.com. Your job is to help the user design their perfect team retreat.",
  });

  return result.toUIMessageStreamResponse();
}