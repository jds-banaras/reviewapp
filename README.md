# JDS Banaras: QR review page

A customer scans the QR stand, picks a star rating, what they shopped for and a language (English, Hinglish or Hindi), and gets a suggested review they can edit. **Copy & post on Google** copies the text and opens JDS Banaras's Google review form (`https://g.page/r/CTrPK9gtUqsqEAE/review`). The customer taps the stars, pastes and posts.

## Files

| Path | What it does |
|---|---|
| `config/business.js` | **Edit this.** Shop description, strengths, categories, languages, review link, social links |
| `public/` | The page (`index.html`, `styles.css`, `app.js`), the logo and the printable card (`print.html`) |
| `api/review.js` | Serverless route that drafts the review with Claude, rate-limited per IP |
| `api/config.js` | Sends the public shop details to the page |
| `lib/generate.js` | Prompt, Claude call and offline template fallback |
| `scripts/make-qr.js` | Generates `public/qr.svg` / `qr.png` for your live URL |
| `scripts/dev-server.js` | Local dev server (same handlers as on Vercel) |

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without `ANTHROPIC_API_KEY`, the page uses built-in template reviews. Set the key to turn on AI drafts:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```

## Deploy (Vercel, free tier)

1. Push this folder to GitHub, then import it at vercel.com/new (no framework, no build command).
2. In **Project → Settings → Environment Variables**, add `ANTHROPIC_API_KEY`. Optionally add `REVIEW_MODEL` (default `claude-opus-5-5`; `claude-haiku-5-5` is about 40× cheaper and good enough for short reviews).
3. Note your URL (for example `https://jds-banaras-review.vercel.app`), then regenerate the QR and redeploy:

```bash
npm run qr -- https://YOUR-URL.vercel.app
```

4. Open `https://YOUR-URL.vercel.app/print.html` and print at 100% scale on A6. Put it in an acrylic stand.

> The included `qr.svg` points to `https://jds-banaras-review.vercel.app`. **Regenerate it if your URL is different**, or the printed QR won't work.

## Customise

- **Social icons:** fill `links` in `config/business.js` (`instagram`, `facebook`, `whatsapp` as a number with country code, `phone`, `website`, `maps`). Empty values are hidden.
- **What the AI says:** edit `description` and `highlights`. Only list things that are true; the prompt tells the model not to invent prices, names or offers.
- **Another shop:** copy the folder, swap `logo.png` and `business.json`, deploy as a new Vercel project.

## Staying within Google's rules

- The draft is a suggestion. The customer edits it and posts it from their own account. Never post reviews for them.
- Every rating goes to Google, low ones included. Don't send only happy customers to Google ("review gating").
- Don't give discounts or gifts in exchange for reviews.
