export default function robots() {
  const base = process.env.SITE_URL || "https://studioxxvii.pt";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/equipa", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
