import type { Metadata } from "next";
import { deckFor, getMember, quotaFor, touch } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import { SwipeDeck } from "./swipe-deck";

export const metadata: Metadata = {
  title: "Swipe · Girls Around the Globe",
};

export default async function SwipePage({ searchParams }: PageProps<"/swipe">) {
  const id = await requireUserId("/swipe");
  const me = await getMember(id);
  if (!me) redirect("/login");
  await touch(id);
  const tonightOnly = (await searchParams).tonight === "1";
  const [deck, quota] = await Promise.all([deckFor(me, 20, { tonightOnly }), quotaFor(me)]);

  return (
    <div className="px-4 py-6 sm:py-8">
      <SwipeDeck
        me={{ name: me.name, palette: me.palette, photos: me.photos, premium: me.premium, passport: me.passport, vibe: me.vibe, freeUntil: me.freeUntil, into: me.into }}
        tonightOnly={tonightOnly}
        initialDeck={deck}
        quota={quota}
      />
    </div>
  );
}
