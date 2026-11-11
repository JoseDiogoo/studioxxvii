export default function sitemap() {
  const base = process.env.SITE_URL || "https://studioxxvii.pt";
  const paginas = ["", "/marcar"];

  return paginas.map((caminho) => ({
    url: `${base}${caminho}`,
    lastModified: new Date(),
    changeFrequency: caminho === "" || caminho === "/marcar" ? "weekly" : "monthly",
    priority: caminho === "" ? 1 : caminho === "/marcar" ? 0.9 : 0.5,
  }));
}
