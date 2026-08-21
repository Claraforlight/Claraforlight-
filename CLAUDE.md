# Vesper 2.0 — Astrologie Intégrée

## Vue d'ensemble

**Vesper 2.0** fusionne quatre systèmes astrologiques en une plateforme professionnelle et orientée business :

1. **Vesper** — Astrologie occidentale classique (signes solaires, lunaires, ascendants)
2. **Boussole Astrale** — Navigation énergétique et synchronisation cosmique
3. **Astrologie Chinoise** — Cycles lunaires et symboles orientaux
4. **Astrologie Cartographique** — Géolocalisation des influences astrales

## Architecture

```
vesper-2.0/
├── index.html              # Application principale
├── assets/
│   ├── fonts/              # Typographies custom
│   └── data/
│       ├── western.json    # Données Vesper (zodiac, houses)
│       ├── compass.json    # Données Boussole Astrale
│       ├── chinese.json    # Astrologie Chinoise
│       └── cartography.json# Cartographie Astrale
├── js/
│   ├── app.js              # Orchestrateur principal
│   ├── systems/
│   │   ├── western.js      # Module Vesper
│   │   ├── compass.js      # Module Boussole Astrale
│   │   ├── chinese.js      # Module Astrologie Chinoise
│   │   └── cartography.js  # Module Cartographie
│   ├── business/
│   │   ├── charts.js       # Génération de thèmes
│   │   ├── readings.js     # Lectures personnalisées
│   │   └── export.js       # Export & partage
│   └── utils/
│       ├── date.js         # Calculs de date/heure
│       ├── geo.js          # Calculs géographiques
│       └── storage.js      # Persistance locale
└── styles/
    └── main.css            # Design moderne & responsive
```

## Systèmes intégrés

### 1. Vesper (Astrologie Occidentale)
- Placements planétaires
- Maisons astrologiques
- Aspects majeurs & mineurs
- Noeuds lunaires

### 2. Boussole Astrale
- Directions énergétiques
- Synchronisation lunaire
- Rituels alignés
- Prédictions mensuelles

### 3. Astrologie Chinoise
- Animal de naissance (12 animaux)
- Éléments (bois, feu, terre, métal, eau)
- Yin/Yang
- Cycles de 12 et 60 ans

### 4. Cartographie Astrale
- Localisation sur carte interactif
- Lignes d'influence (angles)
- Zones Power Spots
- Relocalisation virtuelle

## Features Business

- 📊 Génération de thèmes astraux personnalisés (PDF)
- 💼 Rapports d'affinité pour couples/équipes
- 📱 Partage de résultats (liens sécurisés)
- 💰 Modèle freemium (lectures complètes payantes)
- 📈 Analytics (popularité des signes, tendances)
- 🎯 Lectures sur mesure par expert

## Stack

- HTML5 + CSS3 (design responsive)
- Vanilla JS (zéro dépendance)
- LocalStorage (données locales)
- Canvas/SVG (graphiques)
- Mapbox (cartographie) — optionnel

## Roadmap

- Phase 1️⃣ : MVP avec Vesper + Boussole Astrale
- Phase 2️⃣ : Intégration Astrologie Chinoise
- Phase 3️⃣ : Cartographie interactive
- Phase 4️⃣ : Système de paiement & CRM

