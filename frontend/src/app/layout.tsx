import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bac Guinée — Résultats du Baccalauréat",
  description: "Consultez les résultats du Baccalauréat guinéen par nom, PV ou établissement. Données issues de guineematin.com et mon-portail.gtsco-kag.org.",
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
