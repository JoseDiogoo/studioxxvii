export default function robots() {
  const base = process.env.SITE_URL || "https://studioxxvii.pt";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/equipa", "/api/", "/faq", "/politica-privacidade", "/termos-condicoes"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
