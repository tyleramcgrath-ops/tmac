import type { Metadata } from "next";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Join · Girls Around the Globe",
};

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">Join Girls Around the Globe</h1>
      <p className="mt-2 text-ink-dim">Free, takes two minutes, adults 18+ only.</p>
      <JoinForm />
    </div>
  );
}
