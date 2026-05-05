'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
  "I want to book 'Hotel Paris 3' for 15 people for 4 nights. Calculate the total budget if the hotel is €300/night, flights are €150 per person, meals are €50 per person per day, and there is a 20% VAT on the final total.",
  'Beach offsite in Lisbon for 25 with kayak workshop',
  'Mountain lodge in the Alps for a leadership summit',
  'Wellness retreat in Marrakech with 4-star catering',
];

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, stop } = useChat();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const isThinking = status === 'submitted';
  const isStreaming = status === 'streaming';
  const isBusy = isThinking || isStreaming;

  const updateAutoScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 160;
  };

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  const submitText = (text: string) => {
    const value = text.trim();
    if (!value || isBusy) return;
    shouldAutoScrollRef.current = true;
    sendMessage({ text: value });
    setInput('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitText(input);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#07060d] text-zinc-100">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-violet-600/40 via-fuchsia-500/30 to-transparent blur-3xl animate-aurora" />
        <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-amber-400/25 via-rose-500/25 to-transparent blur-3xl animate-aurora-slow" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-500/20 via-violet-500/25 to-transparent blur-3xl animate-aurora" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <main className="relative mx-auto flex h-full w-full max-w-5xl flex-col p-4 sm:p-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_30px_120px_-30px_rgba(168,85,247,0.45)] backdrop-blur-xl">
          {/* Header */}
          <header className="shrink-0 border-b border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-fuchsia-500/30 animate-float">
                    <span className="font-mono text-base font-bold text-white">S</span>
                  </div>
                  <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-violet-500/40 via-fuchsia-500/40 to-amber-400/40 blur-md" />
                </div>

                <div className="flex flex-col leading-tight">
                  <h1 className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-200 bg-clip-text text-base font-semibold tracking-tight text-transparent sm:text-lg animate-gradient">
                    Seminaire Concierge
                  </h1>
                  <p className="text-xs text-zinc-400">Premium offsite planning, on-demand.</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>
          </header>

          {/* Messages */}
          <div className="relative min-h-0 flex-1">
            <section
              ref={scrollRef}
              onScroll={updateAutoScrollState}
              className="chat-scroll absolute inset-0 space-y-5 overflow-y-auto px-4 py-6 sm:px-8"
            >
              {messages.length === 0 && <EmptyState onPick={submitText} />}

              {messages.map((m) => {
                const firstToolPartIndex = m.parts.findIndex((part) =>
                  part.type.startsWith('tool-'),
                );

                return (
                  <article
                    key={m.id}
                    className={`group relative max-w-[92%] animate-slide-up rounded-3xl border p-4 shadow-xl sm:max-w-[80%] ${
                      m.role === 'user'
                        ? 'ml-auto border-fuchsia-300/30 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-fuchsia-500/30'
                        : 'mr-auto border-white/10 bg-white/[0.04] text-zinc-100 backdrop-blur'
                    }`}
                  >
                    <p
                      className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        m.role === 'user' ? 'text-white/70' : 'text-fuchsia-300/80'
                      }`}
                    >
                      {m.role === 'user' ? 'You' : 'Concierge'}
                    </p>

                    <div className="space-y-2 text-[15px] leading-7 [overflow-wrap:anywhere]">
                      {m.parts.map((part, index) => {
                        if (part.type === 'text') {
                          if (m.role === 'user') {
                            return (
                              <p key={index} className="whitespace-pre-wrap">
                                {part.text}
                              </p>
                            );
                          }
                          return (
                            <ReactMarkdown
                              key={index}
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {normalizeAssistantMarkdown(part.text)}
                            </ReactMarkdown>
                          );
                        }

                        if (part.type.startsWith('tool-')) {
                          return index === firstToolPartIndex ? (
                            <ToolBadge key={index} />
                          ) : null;
                        }

                        return null;
                      })}
                    </div>
                  </article>
                );
              })}

              {isThinking && <ThinkingBubble />}

              <div ref={bottomRef} />
            </section>

            {/* Top/bottom fade overlays */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#07060d] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#07060d] to-transparent" />
          </div>

          {/* Composer */}
          <footer className="shrink-0 border-t border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <form
              onSubmit={handleCustomSubmit}
              className="focus-ring-glow mx-auto flex max-w-4xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 transition-shadow"
            >
              <input
                className="w-full rounded-xl bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                value={input}
                placeholder="Ask for destinations, budgets, venues, agendas…"
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                aria-label="Chat message"
              />

              {isBusy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.1]"
                  aria-label="Stop generation"
                >
                  <span className="h-3 w-3 rounded-[3px] bg-rose-400 group-hover:bg-rose-300" />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:shadow-fuchsia-500/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  aria-label="Send message"
                >
                  Send
                  <SendIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </form>
            <p className="mx-auto mt-2 max-w-4xl px-1 text-[11px] text-zinc-500">
              Press Enter to send. Concierge can search venues live.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components
============================================================ */

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto mt-10 max-w-2xl animate-slide-up text-center">
      <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-amber-400/20 backdrop-blur">
        <SparkleIcon className="h-9 w-9 text-fuchsia-300" />
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/30 to-amber-400/30 blur-xl" />
      </div>

      <h2 className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-200 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl animate-gradient">
        Where shall we plan your next offsite?
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Tell me the vibe, group size, and budget — I&apos;ll handle the rest.
      </p>

      <div className="mt-7 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm text-zinc-300 transition hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:bg-white/[0.07] hover:text-white"
          >
            <span className="block font-medium">{s}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-fuchsia-300/80 opacity-0 transition group-hover:opacity-100">
              Try this <SendIcon className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <article className="animate-slide-up mr-auto max-w-[60%] rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/80">
        Concierge
      </p>
      <div className="flex items-center gap-3">
        <span className="dot-bounce inline-flex">
          <span /> <span /> <span />
        </span>
        <span className="shimmer-text text-sm">Thinking…</span>
      </div>
    </article>
  );
}

function ToolBadge() {
  return (
    <div className="my-1 inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/30 bg-white/[0.05] px-3 py-2 font-mono text-xs text-fuchsia-200">
      <span className="relative inline-flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400" />
      </span>
      Searching venue database…
    </div>
  );
}

function normalizeAssistantMarkdown(markdown: string) {
  return markdown
    .replace(/<ul>\s*/gi, '')
    .replace(/\s*<\/ul>/gi, '')
    .replace(/<li>\s*/gi, '• ')
    .replace(/\s*<\/li>/gi, '<br />')
    .replace(/<br\s*\/?>/gi, '  \n')
    .replace(/&nbsp;/gi, ' ');
}

/* ============================================================
   Icons
============================================================ */

function SendIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M2.4 9.16 17.1 2.84a.75.75 0 0 1 1 1L11.78 18.5a.75.75 0 0 1-1.4-.05l-2.04-5.51a.75.75 0 0 0-.45-.45L2.45 10.55a.75.75 0 0 1-.05-1.4Z" />
    </svg>
  );
}

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2.5l1.4 4.7 4.7 1.4-4.7 1.4L12 14.7l-1.4-4.7-4.7-1.4 4.7-1.4L12 2.5z" />
      <path d="M19 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity=".7" />
      <path d="M5 14l.7 2 2 .7-2 .7L5 19.5l-.7-2.1-2-.7 2-.7L5 14z" opacity=".5" />
    </svg>
  );
}

/* ============================================================
   Markdown components (assistant only)
============================================================ */

const markdownComponents = {
  h1: (p: React.ComponentProps<'h1'>) => (
    <h1 className="mt-3 text-xl font-semibold text-white" {...p} />
  ),
  h2: (p: React.ComponentProps<'h2'>) => (
    <h2 className="mt-3 text-lg font-semibold text-white" {...p} />
  ),
  h3: (p: React.ComponentProps<'h3'>) => (
    <h3 className="mt-3 text-base font-semibold text-white" {...p} />
  ),
  p: (p: React.ComponentProps<'p'>) => <p className="my-2" {...p} />,
  ul: (p: React.ComponentProps<'ul'>) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-fuchsia-400" {...p} />
  ),
  ol: (p: React.ComponentProps<'ol'>) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-fuchsia-400" {...p} />
  ),
  li: (p: React.ComponentProps<'li'>) => <li className="leading-7" {...p} />,
  strong: (p: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-white" {...p} />
  ),
  em: (p: React.ComponentProps<'em'>) => <em className="italic text-zinc-200" {...p} />,
  hr: () => (
    <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
  ),
  a: (p: React.ComponentProps<'a'>) => (
    <a
      className="text-fuchsia-300 underline underline-offset-2 transition hover:text-fuchsia-200"
      target="_blank"
      rel="noreferrer"
      {...p}
    />
  ),
  code: ({
    className,
    children,
    ...rest
  }: React.ComponentProps<'code'>) => {
    const isBlock = /language-/.test(className ?? '');
    if (isBlock) {
      return (
        <code
          className={`block rounded-lg bg-black/60 p-3 font-mono text-xs text-fuchsia-200 ${className ?? ''}`}
          {...rest}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[13px] text-fuchsia-200">
        {children}
      </code>
    );
  },
  pre: (p: React.ComponentProps<'pre'>) => (
    <pre className="my-3 overflow-x-auto rounded-xl bg-black/60 p-3" {...p} />
  ),
  table: (p: React.ComponentProps<'table'>) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-[760px] border-collapse text-sm" {...p} />
    </div>
  ),
  thead: (p: React.ComponentProps<'thead'>) => (
    <thead className="bg-white/[0.05]" {...p} />
  ),
  th: (p: React.ComponentProps<'th'>) => (
    <th
      className="whitespace-nowrap border-b border-white/10 px-4 py-3 text-left font-semibold text-white"
      {...p}
    />
  ),
  td: (p: React.ComponentProps<'td'>) => (
    <td
      className="border-b border-white/5 px-4 py-3 align-top leading-6 text-zinc-200 [overflow-wrap:normal]"
      {...p}
    />
  ),
  blockquote: (p: React.ComponentProps<'blockquote'>) => (
    <blockquote
      className="my-3 border-l-2 border-fuchsia-400/60 pl-3 text-zinc-300"
      {...p}
    />
  ),
};
