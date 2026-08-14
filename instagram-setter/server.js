// Setter Claude pour Instagram — serveur webhook.
//
// Flux :
//   Instagram (DM entrant) -> webhook Meta -> ce serveur -> Claude -> reponse
//   renvoyee dans la conversation Instagram, dans votre ton.
//
// Voir README.md pour la mise en place cote Meta (la partie la plus longue).

import "dotenv/config";
import express from "express";
import { verifySignature, sendMessage } from "./src/instagram.js";
import { generateReply } from "./src/claude.js";
import {
  getMessages,
  appendMessage,
  getState,
  setState,
} from "./src/store.js";

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const IG_BUSINESS_ID = process.env.IG_BUSINESS_ID;

const HANDOFF_KEYWORDS = (process.env.HANDOFF_KEYWORDS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// On garde le corps BRUT pour verifier la signature du webhook.
app.use(express.json({ verify: (req, _res, buf) => (req.rawBody = buf) }));

// --- 1) Verification du webhook (Meta appelle cette URL en GET une fois) ---
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[webhook] verifie ✓");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// --- 2) Reception des messages (Meta envoie un POST a chaque evenement) ---
app.post("/webhook", async (req, res) => {
  if (!verifySignature(req.rawBody, req.get("x-hub-signature-256"))) {
    console.warn("[webhook] signature invalide — ignore");
    return res.sendStatus(403);
  }

  // On repond 200 tout de suite : Meta veut un accuse de reception rapide.
  res.sendStatus(200);

  try {
    for (const entry of req.body.entry || []) {
      for (const event of entry.messaging || []) {
        await handleEvent(event);
      }
    }
  } catch (e) {
    console.error("[webhook] erreur de traitement:", e.message);
  }
});

// Detecte un message "vide" de sens : que des emojis, de la ponctuation,
// ou moins de 2 caracteres reels. On enleve les emojis puis on compte ce
// qui reste de vraiment lisible (lettres/chiffres).
function isTrivial(text) {
  const withoutEmoji = text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[‍️\u{1F3FB}-\u{1F3FF}]/gu, ""); // liaisons, teintes
  const meaningful = withoutEmoji.replace(/[^\p{L}\p{N}]/gu, ""); // lettres+chiffres
  return meaningful.length < 2;
}

// Un "echo" = un message envoye DEPUIS votre compte. Il y en a deux sortes :
//  - ceux que le bot vient d'envoyer (a ignorer),
//  - ceux que VOUS avez ecrits a la main dans Instagram (= vous reprenez la
//    main) -> le bot se met en retrait pour ne pas faire doublon.
function handleEcho(event) {
  const userId = event.recipient?.id; // dans un echo, le destinataire = le prospect
  const text = event.message?.text;
  if (!userId || !text) return;

  // Est-ce simplement le message que le bot vient d'envoyer ? Si oui, on ignore.
  const lastAssistant = [...getMessages(userId)]
    .reverse()
    .find((m) => m.role === "assistant");
  if (lastAssistant && lastAssistant.content.trim() === text.trim()) return;

  // Sinon, c'est VOUS qui avez repondu a la main -> le bot se retire.
  if (getState(userId) !== "handoff") {
    setState(userId, "handoff");
    console.log(`\n✋ Vous avez repris la main sur ${userId} — le bot se retire de cet echange.\n`);
  }
  appendMessage(userId, "assistant", text); // on garde une trace de votre reponse
}

async function handleEvent(event) {
  const senderId = event.sender?.id;
  const text = event.message?.text;

  // Echo : un message parti de votre compte (bot ou vous). Traite a part.
  if (event.message?.is_echo) {
    handleEcho(event);
    return;
  }

  // On ignore : les non-textes et nous-memes.
  if (!senderId || !text) return;
  if (senderId === IG_BUSINESS_ID) return;

  // On ignore aussi les messages "vides" : uniquement des emojis, une
  // reaction, ou un truc trop court sans vrai contenu (ex. "👍", "❤️", "ok").
  // Le bot attend un vrai message avant de repondre.
  if (isTrivial(text)) {
    console.log(`[dm] ${senderId}: message ignore (emoji / trop court): ${text}`);
    return;
  }

  console.log(`[dm] ${senderId}: ${text}`);

  // Remise en main humaine : si l'etat est deja "handoff", on se tait.
  if (getState(senderId) === "handoff") {
    console.log(`[dm] ${senderId} est en mode humain — Claude ne repond pas.`);
    appendMessage(senderId, "user", text);
    return;
  }

  // Mot-cle sensible -> on passe la main a un humain (vous) et on notifie.
  const lower = text.toLowerCase();
  if (HANDOFF_KEYWORDS.some((k) => lower.includes(k))) {
    setState(senderId, "handoff");
    appendMessage(senderId, "user", text);
    console.log(`\n🔔 REPRISE HUMAINE NECESSAIRE — conversation ${senderId}\n`);
    return;
  }

  appendMessage(senderId, "user", text);

  const reply = await generateReply(getMessages(senderId));
  if (!reply) {
    console.warn(`[dm] pas de reponse generee pour ${senderId} — a verifier.`);
    setState(senderId, "handoff");
    return;
  }

  await sendMessage(senderId, reply);
  appendMessage(senderId, "assistant", reply);
  console.log(`[dm] -> reponse envoyee a ${senderId}: ${reply}`);
}

app.get("/", (_req, res) => res.send("Setter Claude actif ✓"));

app.listen(PORT, () => {
  console.log(`Setter Claude en ecoute sur le port ${PORT}`);
});
