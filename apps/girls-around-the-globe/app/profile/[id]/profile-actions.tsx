"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { swipe } from "@/app/actions";

type Status = "matched" | "swiped" | "open";

export function ProfileActions({ id, name, status }: { id: string; name: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  if (status === "matched") {
    return <Link href={`/matches/${id}`} className="btn btn-primary mt-4 w-full">Message {name}</Link>;
  }
  if (status === "swiped") {
    return <p className="mt-4 text-center text-sm text-ink-mute">You&rsquo;ve already swiped on {name}.</p>;
  }

  const act = async (liked: boolean) => {
    setBusy(true);
    const res = await swipe(id, liked);
    setBusy(false);
    if (!res.ok && res.reason === "out-of-likes") return setNotice("You're out of likes for today.");
    router.refresh();
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => act(false)} className="btn btn-ghost text-rose-500">✕ Pass</button>
        <button type="button" disabled={busy} onClick={() => act(true)} className="btn btn-primary">♥ Like</button>
      </div>
      {notice && (
        <p className="mt-2 text-center text-sm text-accent-deep">
          {notice} <Link href="/premium" className="underline">Get Globe+</Link>
        </p>
      )}
    </div>
  );
}
