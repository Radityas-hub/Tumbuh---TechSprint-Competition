import type { Metadata, Viewport } from "next";
// @ts-ignore: Allow side-effect import of global CSS without type declarations
import "./globals.css";

export const metadata: Metadata = {
  title: "Tumbuh - Pendamping Digital ABK",
  description:
    "Frontend prototype untuk platform pendamping orang tua anak berkebutuhan khusus.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06443e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
