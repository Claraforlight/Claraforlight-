// Appels a l'API Meta (Graph) pour Instagram Messaging.
//
// Deux choses :
//  1) verifier que les webhooks viennent bien de Meta (signature),
//  2) envoyer un message prive a un utilisateur.

import crypto from "node:crypto";

const GRAPH = "https://graph.facebook.com/v21.0";
const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

/**
 * Verifie la signature X-Hub-Signature-256 d'un webhook.
 * `rawBody` doit etre le corps BRUT (Buffer), pas le JSON deja parse.
 */
export function verifySignature(rawBody, signatureHeader) {
  if (!APP_SECRET) return true; // pas de secret configure -> on ne bloque pas
  if (!signatureHeader) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * Envoie un message texte a un utilisateur Instagram.
 * @param {string} recipientId  l'ID de la personne (fourni par le webhook)
 * @param {string} text         le message a envoyer
 */
export async function sendMessage(recipientId, text) {
  const res = await fetch(`${GRAPH}/me/messages?access_token=${PAGE_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Envoi Instagram echoue (${res.status}): ${body}`);
  }
  return res.json();
}
