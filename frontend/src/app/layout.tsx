import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bac Guinée — Résultats du Baccalauréat",
  description: "Consultez les résultats du Baccalauréat guinéen par nom, PV ou établissement. Données issues de guineematin.com et mon-portail.gtsco-kag.org.",
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
