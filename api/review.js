import business from "../config/business.json" with { type: "json" };
import { cleanInput, generateReview } from "../lib/generate.js";
import { allow } from "../lib/rate-limit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!allow(ip)) {
    return res.status(429).json({ error: "Too many requests, please wait a minute." });
  }

  const input = cleanInput(req.body || {}, business);
  const result = await generateReview(business, input);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
