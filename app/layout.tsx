import type { Metadata } from "next";
import { Roboto_Slab, DM_Sans, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Dogear",
  description: "A book club for slow readers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoSlab.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${caveat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
