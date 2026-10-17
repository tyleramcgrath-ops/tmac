"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form
      className="card mt-8 space-y-5 p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Email</span>
        <input name="email" type="email" required className="field" autoComplete="email" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Password</span>
        <input name="password" type="password" required className="field" autoComplete="current-password" />
      </label>
      {state?.error && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-deep" role="alert">{state.error}</p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-ink-dim">
        New here? <Link href="/join" className="font-semibold text-accent">Create a free profile</Link>
      </p>
    </form>
  );
}
