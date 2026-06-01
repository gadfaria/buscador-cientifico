import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Buscador Científico — Teses e Dissertações do Brasil",
    template: "%s · Buscador Científico",
  },
  description:
    "Busca federada de teses e dissertações brasileiras, agregando BDTD (IBICT) e o Catálogo da CAPES.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
