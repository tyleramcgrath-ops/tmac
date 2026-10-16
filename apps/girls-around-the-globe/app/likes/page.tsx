import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { getMember, likedMe } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { LikeBackButtons } from "./like-back";

export const metadata: Metadata = {
  title: "Likes · Girls Around the Globe",
};

export default async function LikesPage() {
  const id = await requireUserId("/likes");
  const [me, likes] = await Promise.all([getMember(id), likedMe(id)]);
  const premium = !!me?.premium;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-4xl font-semibold">
        {likes.length} {likes.length === 1 ? "person likes" : "people like"} you
      </h1>
      <p className="mt-2 text-ink-dim">
        {premium ? "Like them back to match instantly." : "Upgrade to Globe+ to see who they are and match instantly."}
      </p>

      {likes.length === 0 ? (
        <div className="card mt-8 p-10 text-center text-ink-dim">
          No new likes yet. Complete your profile with a few photos to get noticed.
          <div><Link href="/me" className="btn btn-primary mt-6">Edit profile</Link></div>
        </div>
      ) : (
        <div className="relative mt-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {likes.map((p, i) => (
              <article key={premium ? p.id : i} className="card overflow-hidden">
                <div className={`relative aspect-[3/4] ${premium ? "" : "pointer-events-none select-none"}`} aria-hidden={!premium}>
                  <div className={premium ? "h-full" : "h-full scale-110 blur-xl"}>
                    {/* Free members get a placeholder, never the real photo or name. */}
                    <Avatar profile={premium ? p : { name: " ", palette: p.palette }} size="lg" />
                  </div>
                  {p.superLiked && <span className="absolute left-2 top-2 rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">★ Super like</span>}
                  {premium && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white">
                      <Link href={`/profile/${p.id}`} className="font-semibold hover:underline">{p.name}, {p.age}</Link>
                      <p className="text-xs text-white/85">{p.flag} {p.city}</p>
                    </div>
                  )}
                </div>
                {premium && <LikeBackButtons id={p.id} name={p.name} />}
              </article>
            ))}
          </div>
          {!premium && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="card max-w-sm p-8 text-center">
                <p className="text-4xl">👀</p>
                <h2 className="mt-3 font-display text-2xl font-semibold">See who likes you</h2>
                <p className="mt-2 text-sm text-ink-dim">Globe+ shows everyone who already swiped right, so you can match in one tap.</p>
                <Link href="/premium?feature=likes" className="btn btn-primary mt-6 w-full">Get Globe+</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
