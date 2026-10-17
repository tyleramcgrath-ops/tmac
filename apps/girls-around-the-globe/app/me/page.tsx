import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deleteAccount, logout } from "@/app/actions";
import { COUNTRIES } from "@/lib/countries";
import { getMember } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { PhotoManager } from "./photo-manager";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Your profile · Girls Around the Globe",
};

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const id = await requireUserId("/me");
  const me = await getMember(id);
  if (!me) redirect("/login");
  const { welcome } = await searchParams;
  const countryCode = COUNTRIES.find((c) => c.name === me.country)?.code ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {welcome ? (
        <div className="card mb-8 bg-sunset p-6 text-white">
          <h1 className="font-display text-3xl font-bold">Welcome, {me.name}! 🌍</h1>
          <p className="mt-1 text-on-accent/80">Add a few photos so people can see you. Profiles with photos get far more matches.</p>
        </div>
      ) : (
        <h1 className="mb-8 font-display text-4xl font-bold">Your profile</h1>
      )}

      <section className="card p-6">
        <h2 className="font-semibold">Photos</h2>
        <p className="text-sm text-ink-dim">Up to 6. Your first photo is the one people see first.</p>
        <PhotoManager photos={me.photos} />
      </section>

      <section className="card mt-6 p-6">
        <h2 className="font-semibold">About you</h2>
        <ProfileForm me={me} countryCode={countryCode} />
      </section>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <form action={logout}>
          <button type="submit" className="btn btn-ghost">Log out</button>
        </form>
        <details className="text-right">
          <summary className="cursor-pointer text-ink-mute underline hover:text-accent-deep">Delete my account</summary>
          <form action={deleteAccount} className="mt-2">
            <p className="mb-2 text-xs text-ink-dim">This permanently deletes your profile, photos, matches and messages.</p>
            <button type="submit" className="btn !bg-rose-700 !py-2 text-white">Yes, delete everything</button>
          </form>
        </details>
      </section>
    </div>
  );
}
