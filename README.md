# Offsite AI Agent — Seminaire Concierge

AI-powered offsite planning assistant for Seminaire.com. The app provides:
- A polished **landing page** with **Clerk** authentication.
- A protected **chat** experience powered by the **Vercel AI SDK** + **OpenRouter** models.
- Tooling for **venue search** (Convex), **budget calculation** (E2B Python sandbox), and **workflow automation** (n8n webhook).
- Optional **observability** (Langfuse traces).

---

## Features

- **Auth-gated chat**: users must sign in/up before accessing `/chat`.
- **Streaming chat UI**: incremental token streaming + tool events.
- **Grounded venue search**: `searchVenues` tool queries Convex.
- **Deterministic budget math**: `calculateBudget` runs Python in E2B.
- **Action layer automation**: `finalizeBooking` triggers an n8n workflow when a user confirms.
- **Tracing** (optional): Langfuse captures sessions, generations, and usage.

---

## Tech stack

- **Next.js** (App Router) + **React**
- **Tailwind CSS**
- **Clerk** (`@clerk/nextjs`) for authentication
- **Convex** for backend functions/data
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) for streaming + tools
- **OpenRouter** for LLM access (via OpenAI-compatible chat completions)
- **E2B Code Interpreter** for secure Python execution
- **Langfuse** (optional) for observability
- **n8n** webhook (optional) for automation

---

## Project structure

Key routes and files:

- **Landing**: `app/page.tsx` (redirects signed-in users to `/chat`)
- **Landing UI**: `app/_components/landing-content.tsx`
- **Chat UI**: `app/chat/page.tsx`
- **Chat API**: `app/api/chat/route.ts`
- **Auth pages**:
  - `app/sign-in/[[...sign-in]]/page.tsx`
  - `app/sign-up/[[...sign-up]]/page.tsx`
- **Route protection**: `middleware.ts` (protects `/chat`)

---

## Prerequisites

- **Node.js**: Node 20+ recommended
- **npm**: any recent npm works
- Accounts/keys (see Environment Variables):
  - Clerk
  - OpenRouter
  - Convex deployment URL
  - (Optional) E2B, Langfuse, n8n

---

## Environment variables

Create a `.env.local` in the project root (do **not** commit it).

### Required

- **Convex**
  - `NEXT_PUBLIC_CONVEX_URL`
  - `CONVEX_DEPLOYMENT` (used by the Convex CLI)

- **LLM (OpenRouter)**
  - `OPENROUTER_API_KEY`
  - (Optional) `OPENROUTER_MODEL` (defaults to `openrouter/free`)

- **Clerk**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

### Optional

- **Langfuse** (observability)
  - `LANGFUSE_PUBLIC_KEY`
  - `LANGFUSE_SECRET_KEY`
  - `LANGFUSE_BASE_URL` (e.g. `https://cloud.langfuse.com`)

- **E2B** (secure Python sandbox)
  - `E2B_API_KEY`

- **n8n** (automation webhook)
  - `N8N_WEBHOOK_URL`

---

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Start Convex (backend)

If you haven’t already set up Convex for this project:

```bash
npx convex dev
```

This will:
- create/use a Convex deployment
- generate `convex/_generated/*`
- provide the `NEXT_PUBLIC_CONVEX_URL` you should place in `.env.local`

### 3) Run the Next.js app

```bash
npm run dev
```

Open:
- Landing: `http://localhost:3000`
- Chat: `http://localhost:3000/chat` (requires sign-in)

---

## How the chat works (high level)

The chat API (`app/api/chat/route.ts`) uses `streamText()` (AI SDK) with a toolset:

- **`searchVenues`** → queries Convex for venues by location
- **`calculateBudget`** → executes Python in an E2B sandbox for reliable budget math
- **`finalizeBooking`** → POSTs to `N8N_WEBHOOK_URL` to trigger automation

The browser consumes the streaming response via `useChat()` (`@ai-sdk/react`), which renders text and tool markers incrementally.

---

## Deployment notes

- This is a standard Next.js app; deploy to Vercel or any Node-compatible host.
- Ensure all environment variables are set in your hosting provider.
- Clerk requires configuring allowed redirect URLs and domains in the Clerk dashboard.

---

## Troubleshooting

### Clerk redirect issues

- Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` match your routes.
- Add allowed redirect URLs in the Clerk dashboard (e.g. `http://localhost:3000/chat`).

### E2B `403 Forbidden` when creating sandboxes

If E2B sandbox creation returns HTML `403` (not JSON), it’s often **network/edge blocking** (VPN, region, corporate proxy, datacenter IP), not your app code.

Validate connectivity with:

```bash
curl -i -X POST "https://api.e2b.app/sandboxes" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $E2B_API_KEY" \
  -d '{"templateID":"code-interpreter-v1","timeout":60}'
```

Expected:
- `201` + JSON if it works
- HTML `403` suggests network blocking

### Langfuse “Unexpected token … not valid JSON”

This typically means the ingestion endpoint returned **non-JSON** (e.g. an internal error page). Verify:
- `LANGFUSE_BASE_URL` is correct for your region
- keys are valid and belong to the same project

---

## Security

- Never commit `.env.local`.
- Rotate keys if they were ever pasted into logs or chats.
- `finalizeBooking` triggers real automation; treat `N8N_WEBHOOK_URL` as a secret.

---

## License

Proprietary — Seminaire.com. (Update this section if you plan to open source.)
