import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMember, isMatch, matchesFor, messagesBetween, touch } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { MatchList } from "../match-list";
import { Chat } from "./chat";

export const metadata: Metadata = {
  title: "Chat · Girls Around the Globe",
};

export default async function ChatPage({ params }: PageProps<"/matches/[id]">) {
  const { id: otherId } = await params;
  const me = await requireUserId(`/matches/${otherId}`);
  if (!(await isMatch(me, otherId))) notFound();
  await touch(me);
  const [other, matches, messages] = await Promise.all([getMember(otherId), matchesFor(me), messagesBetween(me, otherId)]);
  if (!other) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="hidden md:block">
          <MatchList matches={matches} activeId={otherId} />
        </div>
        <Chat other={other} initialMessages={messages} />
      </div>
    </div>
  );
}
