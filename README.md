# 🗺️ Trip Visualizer

Visualise et personnalise un voyage sur une carte interactive : des **étapes** (là où l'on dort, dans un ordre défini) et, autour de chaque étape, des **lieux à visiter** sans ordre précis. Clique sur un point pour éditer ses infos (heures d'arrivée/départ, modalités, notes, adresse Google Maps…). Sauvegarde à la volée, partage par lien, sans authentification.

## Stack

- **Frontend** : React 18 + Vite + TypeScript strict, architecture DDD, Tailwind (UI type shadcn/ui)
- **Carte** : Leaflet + react-leaflet, fond CARTO Voyager, autocomplétion d'adresses via Nominatim (OSM)
- **Backend** : Express + SQLite (better-sqlite3), le voyage est stocké en document JSON
- **Déploiement** : Docker / docker-compose (pensé pour un homelab)

## Développement

```bash
npm install
npm run dev          # front (5173) + back (42069) en parallèle
```

Le front proxifie `/api` vers `http://localhost:42069`. Ouvre http://localhost:5173.

## Production

```bash
npm run build        # build le front dans dist/
npm start            # sert dist/ + l'API sur le PORT (défaut 42069)
```

## Docker (homelab)

```bash
docker compose up -d --build
```

La bdd SQLite est persistée dans `./data` (volume). Accessible sur le port `42069`.

## Variables d'environnement

Voir `.env.example` : `PORT`, `DATABASE_PATH`.
