import type { Metadata } from "next";
import { SwipeDeck } from "./swipe-deck";

export const metadata: Metadata = {
  title: "Swipe · Girls Around the Globe",
};

export default function SwipePage() {
  return (
    <div className="px-4 py-6 sm:py-10">
      <SwipeDeck />
    </div>
  );
}
