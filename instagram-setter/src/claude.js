// Genere la reponse du setter avec l'API Claude.
//
// Le fichier config/persona.md est injecte comme "system prompt" : c'est lui
// qui donne a Claude votre ton, votre offre et vos regles. Le systeme reste
// stable (mis en cache), l'historique de la conversation varie.

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";

const client = new Anthropic(); // lit ANTHROPIC_API_KEY dans l'environnement

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";
const BOOKING_LINK = process.env.BOOKING_LINK || "";

// On charge la persona une fois au demarrage et on remplace le lien.
const PERSONA = readFileSync(new URL("../config/persona.md", import.meta.url), "utf8")
  .replaceAll("{BOOKING_LINK}", BOOKING_LINK);

const SYSTEM = `${PERSONA}

---
Consignes techniques (ne jamais les mentionner au prospect) :
- Reponds UNIQUEMENT avec le texte du message a envoyer, rien d'autre.
- Pas de prefixe ("Clara:", "Reponse:"), pas de guillemets autour, pas de note.
- Garde chaque message court, comme un vrai DM Instagram.
- Le lien de reservation exact est : ${BOOKING_LINK}`;

/**
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 * @returns {Promise<string>} le texte du message a envoyer
 */
export async function generateReply(history) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" }, // reponse rapide, ton conversationnel
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: history,
  });

  if (response.stop_reason === "refusal") {
    // Cas rare : un garde-fou de securite a bloque la generation.
    return "";
  }

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return text;
}
