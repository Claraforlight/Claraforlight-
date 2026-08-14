// Stockage simple des conversations, par utilisateur Instagram.
//
// Version volontairement minimale : tout est gardé en memoire + sauvegarde
// dans un fichier JSON a chaque message. Parfait pour demarrer.
// Pour un usage a fort volume, remplacez par une vraie base (Postgres,
// Supabase, Redis...) en gardant la meme interface (get / append / setState).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const FILE = "./data/conversations.json";
const MAX_TURNS = 40; // on garde les 40 derniers messages par personne

let db = {};
try {
  if (existsSync(FILE)) db = JSON.parse(readFileSync(FILE, "utf8"));
} catch {
  db = {};
}

function persist() {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("[store] echec de sauvegarde:", e.message);
  }
}

function ensure(userId) {
  if (!db[userId]) {
    db[userId] = { messages: [], state: "active", updatedAt: Date.now() };
  }
  return db[userId];
}

// Renvoie l'historique au format attendu par l'API Claude.
export function getMessages(userId) {
  return ensure(userId).messages;
}

// Ajoute un message ("user" = le prospect, "assistant" = Claude/vous).
export function appendMessage(userId, role, content) {
  const conv = ensure(userId);
  conv.messages.push({ role, content });
  if (conv.messages.length > MAX_TURNS) {
    conv.messages = conv.messages.slice(-MAX_TURNS);
  }
  conv.updatedAt = Date.now();
  persist();
}

// Etat de la conversation : "active" ou "handoff" (repris par un humain).
export function getState(userId) {
  return ensure(userId).state;
}

export function setState(userId, state) {
  ensure(userId).state = state;
  persist();
}
