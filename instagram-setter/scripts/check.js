// Verification de la configuration — lancez : npm run check
//
// Ne modifie rien. Lit votre .env et teste chaque brique, puis affiche un
// bilan en vert (ok) / rouge (a corriger). A lancer AVANT de mettre en ligne.

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

let problemes = 0;
const ok = (m, d = "") => console.log(`${GREEN}✅${RESET} ${m}${d ? ` ${DIM}${d}${RESET}` : ""}`);
const ko = (m, d = "") => {
  problemes++;
  console.log(`${RED}❌${RESET} ${m}${d ? ` ${DIM}${d}${RESET}` : ""}`);
};

console.log("\n🩺 Verification de la configuration du setter\n");

// --- 1) Les variables sont-elles remplies ? ---
const requises = [
  "META_VERIFY_TOKEN",
  "META_PAGE_ACCESS_TOKEN",
  "META_APP_SECRET",
  "IG_BUSINESS_ID",
  "ANTHROPIC_API_KEY",
  "BOOKING_LINK",
];
for (const nom of requises) {
  const v = process.env[nom];
  if (v && !v.startsWith("inventez") && !v.includes("votre-lien")) {
    ok(`${nom} est renseigne`);
  } else {
    ko(`${nom} est vide ou pas encore rempli`, "(a completer dans .env)");
  }
}

// --- 2) La cle Claude fonctionne-t-elle vraiment ? ---
if (process.env.ANTHROPIC_API_KEY) {
  try {
    const client = new Anthropic();
    await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-opus-5",
      max_tokens: 8,
      messages: [{ role: "user", content: "dis juste: OK" }],
    });
    ok("La cle Claude fonctionne", "(reponse recue de l'API)");
  } catch (e) {
    ko("La cle Claude ne fonctionne pas", `(${e.status || ""} ${e.message || e})`);
  }
}

// --- 3) Le jeton Meta est-il valide ? ---
if (process.env.META_PAGE_ACCESS_TOKEN) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`,
    );
    const body = await res.json();
    if (res.ok && body.id) {
      ok("Le jeton Meta fonctionne", `(compte: ${body.name || body.id})`);
    } else {
      ko("Le jeton Meta est invalide ou expire", `(${body.error?.message || "erreur"})`);
    }
  } catch (e) {
    ko("Impossible de contacter Meta", `(${e.message})`);
  }
}

// --- Bilan ---
console.log("");
if (problemes === 0) {
  console.log(`${GREEN}Tout est bon ! Vous pouvez lancer le serveur avec: npm start${RESET}\n`);
} else {
  console.log(`${RED}${problemes} point(s) a corriger dans votre fichier .env avant de continuer.${RESET}\n`);
  process.exit(1);
}
