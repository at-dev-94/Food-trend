import { venues } from "./data";

const CITY_WORDS = ["london", "bristol", "leeds", "manchester", "cornwall"];

const TASTE_WORDS = [
  "smoky",
  "spicy",
  "punchy",
  "comforting",
  "rich",
  "fermented",
  "crispy",
  "gamey",
  "umami",
  "tangy",
  "buttery",
  "seafood",
  "savoury",
  "savory",
  "charred",
  "aromatic",
  "earthy",
  "peppery",
  "salty",
  "delicate",
  "pie",
  "roast",
  "pub",
  "pastry",
];

const STYLE_WORDS = [
  "informal",
  "traditional",
  "experimental",
  "romantic",
  "destination",
  "non-pretentious",
];

export function interpret(text) {
  const q = text.toLowerCase();
  const city = CITY_WORDS.find((c) => q.includes(c)) || null;
  const money = q.match(/£\s?(\d+)|under\s+£?\s?(\d+)|(\d+)\s*pounds/);
  const budget = money ? Number(money[1] || money[2] || money[3]) : null;
  const tastes = TASTE_WORDS.filter((w) => q.includes(w)).map((w) =>
    w === "savory" ? "savoury" : w
  );
  if (/(fish\s*(and|&)\s*chips|chippy)/.test(q)) tastes.push("seafood", "crispy");
  if (/curry|tandoor|indian|pakistani/.test(q)) tastes.push("spicy", "aromatic");
  if (/breakfast|full english/.test(q)) tastes.push("savoury", "comforting");
  const styles = STYLE_WORDS.filter((w) => q.includes(w));
  if (/not formal|non-pretentious|non pretentious|unpretentious|old-school|old school/.test(q)) {
    styles.push("non-pretentious", "informal");
  }
  if (/worth (the )?(drive|driving|journey|train)|travel/.test(q)) styles.push("destination");
  if (/instagram|not famous|don't care about stars|michelin/.test(q)) styles.push("hidden");
  const hidden = /hidden|undiscovered|locals|not famous|instagram/.test(q);
  const journey = /worth (the )?(drive|driving|journey|train)|destination|travel/.test(q);
  const tonight = /tonight|now/.test(q);
  return {
    city,
    budget,
    tastes: [...new Set(tastes)],
    styles: [...new Set(styles.filter((s) => s !== "hidden"))],
    hidden,
    journey,
    tonight,
  };
}

export function rankVenues(intent, list = venues) {
  return list
    .map((venue) => {
      let score = venue.mti * 0.45;
      const reasons = [];
      if (intent.city && venue.city.toLowerCase() !== intent.city) score -= 40;
      else if (intent.city) reasons.push(venue.city);
      if (intent.budget && venue.ceiling > intent.budget) score -= 28;
      else if (intent.budget) reasons.push(`under £${intent.budget}`);
      const tasteHits = intent.tastes.filter((t) => venue.tastes.includes(t));
      score += tasteHits.length * 14;
      if (tasteHits.length) reasons.push(tasteHits.slice(0, 3).join(" · "));
      const styleHits = intent.styles.filter((s) => venue.styles.includes(s));
      score += styleHits.length * 8;
      if (intent.hidden && venue.hiddenGem) {
        score += 16;
        reasons.push("high taste / low visibility");
      }
      if (intent.journey && venue.journey) {
        score += 16;
        reasons.push("worth the journey");
      }
      score += venue.momentum * 0.08;
      return { venue, score, reasons, tasteHits };
    })
    .sort((a, b) => b.score - a.score);
}

export function recommend(text, limit = 3) {
  const intent = interpret(text);
  const ranked = rankVenues(intent).slice(0, limit);
  return { intent, ranked };
}

export function tasteMatch(profile) {
  const intent = {
    city: profile.city && profile.city !== "all" ? profile.city : null,
    budget: profile.budget || null,
    tastes: profile.flavours || [],
    styles: profile.experiences || [],
    hidden: profile.experiences?.includes("independent"),
    journey: profile.experiences?.includes("destination"),
  };
  return rankVenues(intent).slice(0, 4);
}
