import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greece Chauffeur Service — Operations",
  description: "Operations and dispatch portal.",
  robots: { index: false, follow: false },
};

export default function AppRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
