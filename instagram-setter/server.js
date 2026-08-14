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

async function handleEvent(event) {
  const senderId = event.sender?.id;
  const text = event.message?.text;

  // On ignore : les echos (nos propres envois), les non-textes, nous-memes.
  if (!senderId || !text) return;
  if (event.message?.is_echo) return;
  if (senderId === IG_BUSINESS_ID) return;

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
