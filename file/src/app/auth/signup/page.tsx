"use client";

import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efeaff] via-[#cfeee7] to-[#ffd9cc] text-[#2e2a3a]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-[32px] border border-white/60 bg-white/70 p-8 text-center shadow-[0_20px_60px_-35px_rgba(46,42,58,0.35)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2e2a3a]/60">
            Pastel todo studio
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Create your account</h1>
          <p className="mt-3 text-sm text-[#2e2a3a]/70">
            Sign up directly from the main workspace to start saving and managing
            your tasks instantly.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-full bg-[#2e2a3a] px-6 py-3 text-sm font-semibold text-white"
            >
              Open signup form
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#2e2a3a]/20 bg-white px-6 py-3 text-sm font-semibold text-[#2e2a3a]"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
