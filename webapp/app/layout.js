import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Studio XXVII — Barbearia em Alcobaça",
  description:
    "Studio XXVII — barbearia em Alcobaça. Cortes, barba e grooming de assinatura. Marca já o teu horário online.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body className={`${playfair.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
