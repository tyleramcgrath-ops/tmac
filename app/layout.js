import "./globals.css";

export const metadata = {
  title: "Centris AI Assist",
  description:
    "Human-first, AI-accelerated support assistant for Centris Info.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
