import { Suspense } from "react";
import { HomeSearch } from "@/components/home-search";

export const metadata = { title: "Homes for auction in Tampa Bay — Gavel" };

export default function HomesPage() {
  return (
    <Suspense>
      <HomeSearch />
    </Suspense>
  );
}
