import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";

import "./globals.css";

export const metadata = {
  title: "Centris — Every conversation, on key.",
  description:
    "Centris listens to live customer conversations and tells your agents the best thing to say, in any language, in the moment.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
