import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusFix — NIT Hamirpur",
  description: "Report campus issues privately and follow their progress with CampusFix.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
