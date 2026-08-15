import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greece Chauffeur — Connection Test",
  description: "Technical deployment and connection test for the Greece Chauffeur project.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
