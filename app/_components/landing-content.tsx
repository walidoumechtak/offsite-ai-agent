'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';

export function LandingContent() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07060d] text-zinc-100">
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

      <header className="relative z-10 border-b border-white/5 bg-[#07060d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-fuchsia-500/25">
              <span className="font-mono text-base font-bold text-white">S</span>
            </div>
            <div>
              <p className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-200 bg-clip-text text-sm font-semibold text-transparent sm:text-base">
                Seminaire Concierge
              </p>
              <p className="text-xs text-zinc-500">by Seminaire.com</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <SignInButton mode="modal" forceRedirectUrl="/chat">
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/chat">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:shadow-fuchsia-500/40"
              >
                Get started
              </button>
            </SignUpButton>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-fuchsia-200/90">
            AI offsite planner
          </p>
          <h1 className="bg-gradient-to-r from-violet-100 via-fuchsia-100 to-amber-100 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl sm:leading-[1.1]">
            Plan unforgettable team retreats in minutes
          </h1>
          <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Describe your goals, group size, and budget — our concierge searches real venues, runs
            budget math in a secure sandbox, and helps you ship a polished offsite plan.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <SignUpButton mode="modal" forceRedirectUrl="/chat">
              <button
                type="button"
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30 transition hover:shadow-fuchsia-500/45 sm:w-auto"
              >
                Start planning free
              </button>
            </SignUpButton>
            <Link
              href="/sign-in"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-3.5 text-center text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Live venue search',
              body: 'Ground recommendations in your Convex-backed catalog so proposals stay concrete.',
            },
            {
              title: 'Budget you can trust',
              body: 'Complex totals, VAT, and currency work run in an isolated E2B code sandbox.',
            },
            {
              title: 'Concierge-grade UX',
              body: 'Streaming answers, markdown tables, and a focused planner workflow.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left shadow-[0_20px_80px_-40px_rgba(168,85,247,0.5)]"
            >
              <h2 className="text-base font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
