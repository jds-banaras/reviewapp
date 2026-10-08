import business from "../config/business.js";
// Public shop details for the page. Prompt-only fields stay server-side.
export default function handler(req, res) {
  const { name, tagline, categories, languages, reviewUrl, links } = business;
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ name, tagline, categories, languages, reviewUrl, links });
}
