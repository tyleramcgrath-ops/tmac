import type { Metadata } from "next";
import { deckFor, getMember, quotaFor, touch } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import { SwipeDeck } from "./swipe-deck";

export const metadata: Metadata = {
  title: "Swipe · Girls Around the Globe",
};

export default async function SwipePage() {
  const id = await requireUserId("/swipe");
  const me = await getMember(id);
  if (!me) redirect("/login");
  await touch(id);
  const [deck, quota] = await Promise.all([deckFor(me), quotaFor(me)]);

  return (
    <div className="px-4 py-6 sm:py-8">
      <SwipeDeck
        me={{ name: me.name, palette: me.palette, photos: me.photos, premium: me.premium, passport: me.passport }}
        initialDeck={deck}
        quota={quota}
      />
    </div>
  );
}
