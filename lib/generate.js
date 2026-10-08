import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.REVIEW_MODEL || "claude-opus-5-5";

// Each request gets a random focus so drafts don't all read alike.
const ANGLES = [
  "the quality of the weave and zari work",
  "how the staff helped choose",
  "the range of colours and designs",
  "value for money",
  "the shopping experience overall",
  "a specific occasion like a wedding or festival",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function cleanInput(body, business) {
  const rating = Math.min(5, Math.max(1, parseInt(body?.rating, 10) || 5));
  const category = business.categories.includes(body?.category) ? body.category : "All";
  const language = business.languages.includes(body?.language) ? body.language : business.languages[0];
  return { rating, category, language };
}

function buildPrompt(business, { rating, category, language }) {
  const system = `You draft short Google review suggestions for customers of a local shop. The customer reads your draft, edits it if they want, and posts it themselves under their own name.

Shop: ${business.name}, ${business.city}
About: ${business.description}
Known strengths: ${business.highlights.join("; ")}

Rules:
- 2 to 3 sentences, under 50 words, first person, sounding like a real customer typing on a phone.
- Match the star rating honestly. 5 = delighted, 4 = happy with a small reservation, 3 = mixed, 1-2 = disappointed but fair and polite. Never inflate a low rating.
- Do not invent specific facts (prices, staff names, discounts, dates). Keep claims general.
- No hashtags, no emojis, no quotation marks, no star counts in the text.
- Output only the review text.`;

  const langNote = {
    English: "Write in natural Indian English.",
    Hinglish: "Write in Hinglish: Hindi in Roman script mixed with English, the way people text in India.",
    Hindi: "Write in Hindi using Devanagari script.",
  }[language];

  const user = `Rating: ${rating} out of 5 stars
Bought / browsed: ${category === "All" ? "anything from the shop" : category}
Focus on: ${pick(ANGLES)}
${langNote}`;

  return { system, user };
}

export async function generateReview(business, input) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { text: templateReview(business, input), source: "template" };
  }

  const client = new Anthropic();
  const { system, user } = buildPrompt(business, input);

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: user }],
    });

    if (response.stop_reason === "refusal") {
      return { text: templateReview(business, input), source: "template" };
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^["']|["']$/g, "");
    return { text: text || templateReview(business, input), source: text ? "ai" : "template" };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.warn("Claude rate limited, using template");
    } else if (err instanceof Anthropic.APIError) {
      console.error(`Claude API error ${err.status}: ${err.message}`);
    } else {
      console.error("Review generation failed:", err);
    }
    return { text: templateReview(business, input), source: "template" };
  }
}

// Offline fallback so the page always works (no API key, outage, refusal).
function templateReview(business, { rating, category, language }) {
  const item = category === "All" ? "" : category.toLowerCase();
  const HINDI_ITEMS = { sarees: "साड़ियों", lehenga: "लहंगों", dupatta: "दुपट्टों", "suits & fabric": "सूट और कपड़ों" };
  const hiItem = HINDI_ITEMS[item] || "";
  const T = {
    English: {
      good: [
        `Lovely experience at ${business.name}. ${item ? `The ${item} collection` : "The collection"} is beautiful and the weaving quality really shows.`,
        `Found exactly what I wanted at ${business.name}. Genuine Banarasi work, ${pick(business.highlights)}.`,
        `Highly recommend ${business.name} for anyone looking for real Banarasi ${item || "silk"}. Staff were patient and helpful.`,
      ],
      ok: [`Good collection at ${business.name}, especially the ${item || "sarees"}. A few things could be better, but overall a decent visit.`],
      bad: [`My visit to ${business.name} was not up to my expectations this time. I hope they improve, as the ${item || "collection"} has potential.`],
    },
    Hinglish: {
      good: [
        `${business.name} ka collection bahut accha hai, ${item || "sarees"} ki quality ekdum genuine Banarasi hai. Staff ne bhi achhe se dikhaya.`,
        `Shaadi ke liye ${item || "saree"} lene aaye the, ${business.name} mein perfect mil gaya. Weaving aur zari ka kaam kamaal hai.`,
      ],
      ok: [`${business.name} mein ${item || "collection"} theek tha, kuch cheezein aur better ho sakti thi. Overall decent experience.`],
      bad: [`Is baar ${business.name} ka experience utna accha nahi raha. Umeed hai aage improve karenge.`],
    },
    Hindi: {
      good: [
        `${business.name} में असली बनारसी ${hiItem || "साड़ियों"} का बहुत सुंदर संग्रह है। बुनाई और ज़री का काम शानदार है।`,
        `${business.name} पर खरीदारी का अनुभव बहुत अच्छा रहा। स्टाफ ने धैर्य से सब दिखाया।`,
      ],
      ok: [`${business.name} में संग्रह अच्छा है, कुछ बातें और बेहतर हो सकती हैं। कुल मिलाकर ठीक अनुभव।`],
      bad: [`इस बार ${business.name} का अनुभव उम्मीद के मुताबिक नहीं रहा। आशा है आगे सुधार होगा।`],
    },
  }[language];
  return pick(rating >= 4 ? T.good : rating === 3 ? T.ok : T.bad);
}
