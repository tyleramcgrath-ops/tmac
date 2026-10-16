import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessionUserId } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in · Girls Around the Globe",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await sessionUserId()) redirect("/swipe");
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-ink-dim">Log in to keep swiping.</p>
      <LoginForm next={typeof next === "string" ? next : "/swipe"} />
    </div>
  );
}
