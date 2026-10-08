const $ = (id) => document.getElementById(id);
const state = { rating: 5, category: "All", language: "English", config: null, req: 0 };

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const ICONS = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  facebook: '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>',
  whatsapp: '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-2z"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  maps: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
};
const LINK_LABELS = { instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", phone: "Call us", website: "Website", maps: "Directions" };

function linkHref(key, value) {
  if (key === "whatsapp") return `https://wa.me/${value.replace(/\D/g, "")}`;
  if (key === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  return value;
}

function radioGroup(container, items, current, onPick, cls = "chip") {
  container.innerHTML = "";
  items.forEach((item) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(item === current));
    b.textContent = item;
    b.onclick = () => {
      container.querySelectorAll("[role=radio]").forEach((x) => x.setAttribute("aria-checked", "false"));
      b.setAttribute("aria-checked", "true");
      onPick(item);
    };
    container.appendChild(b);
  });
}

function renderStars() {
  const box = $("stars");
  box.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star" + (i <= state.rating ? " on" : "");
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(i === state.rating));
    b.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
    b.innerHTML = STAR;
    b.onclick = () => { state.rating = i; renderStars(); scheduleDraft(); };
    box.appendChild(b);
  }
}

let draftTimer;
function scheduleDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(loadDraft, 250);
}

async function loadDraft() {
  const id = ++state.req;
  $("draft").closest(".draft").classList.add("loading");
  try {
    const r = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: state.rating, category: state.category, language: state.language }),
    });
    const data = await r.json();
    if (id !== state.req) return; // a newer request superseded this one
    if (!r.ok) throw new Error(data.error || "Request failed");
    $("draft").value = data.text;
  } catch (e) {
    if (id === state.req) toast(e.message || "Could not load a suggestion. You can type your own.");
  } finally {
    if (id === state.req) $("draft").closest(".draft").classList.remove("loading");
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = $("draft");
    ta.focus();
    ta.select();
    try { return document.execCommand("copy"); } catch { return false; }
  }
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

async function postToGoogle() {
  const text = $("draft").value.trim();
  if (text) {
    const ok = await copyText(text);
    toast(ok ? "Copied! Paste it into the Google review box." : "Select the text and copy it, then paste on Google.");
  }
  setTimeout(() => { window.location.href = state.config.reviewUrl; }, text ? 900 : 0);
}

async function init() {
  const cfg = await fetch("/api/config").then((r) => r.json());
  state.config = cfg;
  state.language = cfg.languages[0];
  document.title = `Review ${cfg.name}`;
  if (cfg.tagline) $("tagline").textContent = cfg.tagline;
  $("own").href = cfg.reviewUrl;

  renderStars();
  radioGroup($("categories"), cfg.categories, state.category, (c) => { state.category = c; scheduleDraft(); });
  radioGroup($("languages"), cfg.languages, state.language, (l) => { state.language = l; scheduleDraft(); });

  const nav = $("links");
  Object.entries(cfg.links || {}).forEach(([key, value]) => {
    if (!value || !ICONS[key]) return;
    const a = document.createElement("a");
    a.href = linkHref(key, value);
    a.target = key === "phone" ? "_self" : "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", LINK_LABELS[key]);
    a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key]}</svg>`;
    nav.appendChild(a);
  });

  $("refresh").onclick = loadDraft;
  $("post").onclick = postToGoogle;
  loadDraft();
}

init().catch(() => toast("Something went wrong. Please refresh the page."));
