import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bac Guinée — Résultats du Baccalauréat",
    short_name: "Bac Guinée",
    description: "Consultez les résultats du Baccalauréat guinéen par nom, PV ou établissement.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8c71f6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
