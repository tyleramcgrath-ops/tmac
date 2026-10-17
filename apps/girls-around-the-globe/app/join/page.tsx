import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VIBES, type Vibe } from "@/lib/profiles";
import { sessionUserId } from "@/lib/session";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Join · Girls Around the Globe",
};

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  if (await sessionUserId()) redirect("/swipe");
  // The homepage's "I'm looking for" picker carries over as ?looking=.
  const looking = String((await searchParams).looking ?? "");
  const initialLooking = (VIBES as string[]).includes(looking) ? (looking as Vibe) : undefined;
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Join Girls Around the Globe</h1>
      <p className="mt-2 text-ink-dim">Free, takes two minutes, adults 18+ only. Then start meeting people who want what you want.</p>
      <JoinForm initialLooking={initialLooking} />
    </div>
  );
}
