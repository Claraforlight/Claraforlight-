# Setter Claude pour Instagram 🤖💬

Un petit serveur qui **répond automatiquement à vos DMs Instagram entrants**,
dans **votre ton**, qui **qualifie** les prospects et **propose un appel** —
sans que vous touchiez votre téléphone.

- ✅ **100 % conforme** : basé sur l'API officielle Meta Instagram Messaging.
  Il ne fait que **répondre** aux gens qui vous écrivent (aucun envoi de DM à
  des inconnus → aucun risque de blocage de compte).
- ✅ **Aucun abonnement mensuel** en plus : vous payez seulement l'usage de
  l'API Claude (quelques centimes par conversation).
- ✅ **Votre voix** : tout se règle dans `config/persona.md`.

---

## ⚠️ Ce que ce système fait (et ne fait pas)

| Fait ✅ | Ne fait pas ❌ |
|---|---|
| Répond aux DMs que vous **recevez** | Envoyer des DMs à des **inconnus** (interdit par Meta) |
| Répond aux commentaires transformés en DM | Scraper / automatiser des comptes tiers |
| Qualifie, relance, propose un appel | Garantir des résultats ou remplacer votre jugement |

Le cold-DM massif fait bannir les comptes. Ce système ne le fait pas — et
c'est exactement pour ça qu'il est durable.

---

## 🗺️ Vue d'ensemble

```
Un prospect vous écrit  ─▶  Webhook Meta  ─▶  ce serveur  ─▶  Claude (votre ton)
                                                                     │
                                          réponse renvoyée dans le DM ◀┘
```

Il vous faut **4 briques** :

1. Un **compte Instagram Pro** (Business ou Créateur) lié à une **Page Facebook**.
2. Une **app Meta** avec le produit *Instagram* + les webhooks.
3. Une **clé API Claude** (console.anthropic.com).
4. Ce **serveur** hébergé quelque part de joignable en HTTPS.

---

## 1. Prérequis Instagram / Facebook

1. Passez votre compte Instagram en **Professionnel** (Réglages → Type de compte).
2. Créez (ou réutilisez) une **Page Facebook** et **liez-la** à votre compte
   Instagram (Page → Paramètres → Comptes liés → Instagram).
3. Dans Instagram : Réglages → **Messages** → autorisez l'accès aux messages
   depuis des outils tiers (« Connected Tools » / « Autoriser l'accès aux
   messages »).

## 2. Créer l'app Meta

1. Allez sur **developers.facebook.com** → *Mes apps* → **Créer une app**.
2. Type : **Entreprise** (Business).
3. Ajoutez le produit **Instagram** (ou « Messenger » selon l'interface —
   Instagram Messaging passe par la plateforme Messenger).
4. Dans l'app, section **Instagram → Configuration de l'API**, associez votre
   Page/compte Instagram et **générez un jeton d'accès de Page**
   (*Page Access Token*). Copiez-le dans `META_PAGE_ACCESS_TOKEN`.
5. Dans **Réglages → Général**, copiez le **App Secret** dans `META_APP_SECRET`.
6. Récupérez l'**ID de votre compte Instagram Pro** (Instagram Business
   Account ID) et mettez-le dans `IG_BUSINESS_ID`.

## 3. Configurer le webhook

1. Hébergez d'abord le serveur (voir §5) pour avoir une URL HTTPS publique,
   par ex. `https://votre-domaine.com/webhook`.
2. Dans l'app Meta → **Webhooks** (ou Instagram → Webhooks) :
   - **URL de rappel** : `https://votre-domaine.com/webhook`
   - **Verify token** : la phrase secrète que vous avez mise dans
     `META_VERIFY_TOKEN` (identique des deux côtés).
3. Cliquez sur **Vérifier et enregistrer**. Meta appelle votre serveur ; si
   tout va bien vous verrez `[webhook] verifie ✓` dans les logs.
4. **Abonnez-vous** au champ **`messages`** (et `messaging_postbacks` si
   proposé).

## 4. Validation de l'app (App Review)

Pour que le bot fonctionne avec **d'autres personnes que vous**, Meta demande
la permission **`instagram_manage_messages`** via l'**App Review** :

- En mode **Développement**, ça marche déjà avec vous-même et les comptes de
  test / rôles ajoutés à l'app → **parfait pour tester tout de suite.**
- Pour passer en **Production** (tout le monde), soumettez l'app à la
  validation Meta en expliquant l'usage (« répondre au support / aux
  prospects qui nous contactent en DM »). Comptez quelques jours.

## 5. Lancer le serveur

```bash
cd instagram-setter
cp .env.example .env      # puis remplissez le .env
npm install
npm start
```

Pour être joignable par Meta, le serveur doit être **en HTTPS et public**.
Options simples :

- **Test local** : [ngrok](https://ngrok.com) → `ngrok http 3000`, puis
  utilisez l'URL `https://...ngrok.../webhook` comme URL de rappel.
- **Production** : hébergez sur Railway, Render, Fly.io, un petit VPS… (ces
  plateformes fournissent le HTTPS automatiquement). Mettez-y les mêmes
  variables d'environnement que votre `.env`.

## 6. Personnaliser votre setter ✍️

Ouvrez **`config/persona.md`** et réécrivez-le avec VOS mots :
votre offre, votre client idéal, votre prix, votre façon de parler.
C'est ce fichier qui fait que « personne ne saura que c'est de l'IA ».

Réglez aussi dans `.env` :
- `BOOKING_LINK` → votre lien Calendly / Cal.com.
- `HANDOFF_KEYWORDS` → mots qui font que Claude se tait et vous laisse
  reprendre (ex. « remboursement », « parler à quelqu'un »).

---

## 🔒 Sécurité & bon sens

- Le `.env` contient des secrets : il n'est **jamais** commité (voir
  `.gitignore`). Ne le partagez pas.
- Le bot **passe la main à un humain** (vous) dès qu'un mot-clé sensible
  apparaît, et note `🔔 REPRISE HUMAINE NECESSAIRE` dans les logs.
- **Si vous répondez vous-même** dans l'app Instagram, le bot le détecte et
  **se retire automatiquement de cette conversation** (plus de doublon). Il
  note `✋ Vous avez repris la main` dans les logs. Il ne répondra plus à cette
  personne — à vous de continuer l'échange à la main.
- Il ne prétend jamais être une IA, mais reste honnête : pas de fausses
  promesses, pas d'infos inventées.
- Testez d'abord avec vous-même avant d'ouvrir à de vrais prospects.

## 🧩 Structure du projet

```
instagram-setter/
├── server.js            → le serveur webhook (point d'entrée)
├── src/
│   ├── instagram.js     → API Meta : signature + envoi de messages
│   ├── claude.js        → génération de la réponse (votre ton)
│   └── store.js         → mémoire des conversations
├── config/
│   └── persona.md       → VOTRE voix, votre offre (à personnaliser)
├── .env.example         → à copier en .env et remplir
└── package.json
```

## ❓ Dépannage rapide

| Symptôme | Piste |
|---|---|
| `[webhook] verifie ✓` n'apparaît pas | Le `META_VERIFY_TOKEN` du `.env` et celui saisi chez Meta doivent être **identiques**. |
| `signature invalide` | `META_APP_SECRET` incorrect, ou le corps de la requête est modifié par un proxy. |
| `Envoi Instagram echoue (190/...)` | Jeton de Page expiré → régénérez `META_PAGE_ACCESS_TOKEN`. |
| Le bot ne répond qu'à vous | Normal en mode Développement — passez l'App Review (§4). |
| Réponses hors sujet | Enrichissez `config/persona.md` (offre, exemples, règles). |
