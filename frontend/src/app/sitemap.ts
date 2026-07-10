import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bac.afrovizion.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/recherche", "/archives", "/stats", "/etablissements", "/contact"];

  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
