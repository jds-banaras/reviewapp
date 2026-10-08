// Usage: npm run qr -- https://your-site.vercel.app
// Writes public/qr.svg (for the print card) and public/qr.png (for sharing).
import QRCode from "qrcode";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Give the deployed page URL, e.g.  npm run qr -- https://jds-banaras-review.vercel.app");
  process.exit(1);
}

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
// High error correction so the QR still scans with the logo badge printed over its centre.
const opts = { errorCorrectionLevel: "H", margin: 1, color: { dark: "#2e221c", light: "#ffffff" } };

await QRCode.toFile(path.join(out, "qr.svg"), url, { ...opts, type: "svg" });
await QRCode.toFile(path.join(out, "qr.png"), url, { ...opts, width: 1200 });
console.log(`QR codes for ${url} written to public/qr.svg and public/qr.png`);
console.log("Open /print.html and print it (A6, or 2 per A5 sheet) for the counter stand.");
