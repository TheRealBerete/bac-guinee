import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bac.afrovizion.com";
const SITE_TITLE = "Bac Guinée — Résultats du Baccalauréat";
const SITE_DESCRIPTION =
  "Consultez les résultats du Baccalauréat guinéen par nom, PV ou établissement.";
const OG_IMAGE = "/illustrations/joyeux-en-famille-resultats.webp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1672, height: 941 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  appleWebApp: {
    title: "Bac Guinée",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#8c71f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
