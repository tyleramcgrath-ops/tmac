import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchesView } from "./matches-view";

export const metadata: Metadata = {
  title: "Matches · Girls Around the Globe",
};

export default function MatchesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Suspense>
        <MatchesView />
      </Suspense>
    </div>
  );
}
