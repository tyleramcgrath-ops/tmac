import { Suspense } from "react";
import { HomeSearch } from "@/components/home-search";

export const metadata = { title: "Homes for auction in Palm Beach County — Gavel" };

export default function HomesPage() {
  return (
    <Suspense>
      <HomeSearch />
    </Suspense>
  );
}
