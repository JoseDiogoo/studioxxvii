import { Playfair_Display, Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

// Títulos do site público: condensada, fina e em maiúsculas (home e marcação).
const bebas = Bebas_Neue({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: "400",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.SITE_URL || "https://studioxxvii.pt";
const TITULO = "Studio XXVII — Barbearia em Alcobaça";
const DESCRICAO =
  "Studio XXVII — barbearia em Alcobaça. Cortes, barba e grooming de assinatura. Marca já o teu horário online.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITULO, template: "%s — Studio XXVII" },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: "/",
    siteName: "Studio XXVII",
    images: [{ url: "/fotos/interior-cadeira.png", width: 1200, height: 900 }],
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: ["/fotos/interior-cadeira.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body className={`${playfair.variable} ${inter.variable} ${bebas.variable}`}>
        {children}
      </body>
    </html>
  );
}
