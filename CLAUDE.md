# CLAUDE.md — Trip Visualizer

> Dernière mise à jour : 2026-07-20

App web pour visualiser un voyage (Japon) sur une carte : étapes ordonnées (nuits) + lieux satellites sans ordre. Édition à la volée, autosave, partage par lien, **sans authentification**.

## Stack

- Front : **React 18 + Vite + TypeScript strict**, DDD, **Tailwind** (composants type shadcn/ui faits main dans `src/presentation/components/ui/`)
- Carte : **MapLibre GL + react-map-gl** (`react-map-gl/maplibre`), styles **vectoriels CARTO GL** (gratuits, sans clé) : `voyager` (clair) / `dark-matter` (sombre). Labels forcés en **français** via `setLayoutProperty`.
- **Thème clair/sombre** : `ThemeProvider` (classe `dark` sur `<html>`, persisté localStorage). Primary = **bleu**.
- **Responsive** : mobile (<768px) = **lecture seule** (`MobileTripView`), tablette et + = éditable (`useIsMobile`).
- Autocomplétion adresses : **Nominatim** (OSM), gratuit, sans clé (`src/infrastructure/geocoding/nominatim.ts`)
- Back : **Express + `node:sqlite`** (SQLite embarqué dans Node 24, aucun module natif à compiler), exécuté via **tsx** (pas de compilation JS du serveur)
- Le voyage complet est stocké **en document JSON** dans une seule table `trips` (pas de modèle relationnel éclaté)

## Commandes

- `npm run dev` : Vite (5173) + serveur tsx watch (3001) via `concurrently`. Proxy `/api` → 3001.
- `npm run build` : `tsc -b` (3 sous-projets) + `vite build` → `dist/`
- `npm start` : `NODE_ENV=production tsx server/index.ts` (sert `dist/` + API)
- `docker compose up -d --build` : homelab, bdd persistée dans `./data`

## Structure DDD

```
shared/types/trip.ts          # Types partagés front/back (Trip, Stage, Place, Accommodation, Transport)
server/                       # Backend (db, repository JSON, routes, defaultTrip)
src/domain/trip/              # repositories/ (interface), services/ (factory + mutations pures)
src/application/              # (réservé aux use cases — actuellement le repo suffit)
src/infrastructure/          # http/ (client centralisé), trip/ (HttpTripRepository), geocoding/
src/presentation/            # pages/, components/ (map, panels, ui), hooks/, types.ts
```

## Domaine `trip`

### Entités (`shared/types/trip.ts`)
- **Trip** : `id, title, description?, stages[], transports[], createdAt, updatedAt`
- **Stage** (étape/nuit) : `id, name, color, accommodation?, places[], transportToNext?, notes?` — `transportToNext` = jambe de trajet vers l'étape suivante
- **Accommodation** : `name, address?, location?{lat,lng}, googleMapsUrl?, checkInDate?, checkOutDate?, arrivalTime?, departureTime?, modalities?, notes?`
- **Place** (lieu satellite) : `id, name, category, address?, location?, googleMapsUrl?, notes?, visited`
- **Transport** : `id, mode, label, from?, to?, date?, departureTime?, arrivalTime?, reference?, price?, currency?, notes?` — `mode` inclut `car`
- Deux usages de Transport : **jambe entre étapes** (`stage.transportToNext`) et **trajets libres** (`trip.transports`, panneau « Autres trajets »)
- `TripInput = Omit<Trip,'id'|'createdAt'|'updatedAt'>`

### Repository (`src/domain/trip/repositories/TripRepository.ts`)
`list()`, `getById(id)`, `create(input?)`, `update(id, input)`, `remove(id)`. Impl HTTP : `src/infrastructure/trip/HttpTripRepository.ts` (instance `tripRepository`).

### Services domaine (purs, renvoient un nouveau Trip)
- `tripFactory.ts` : `createStage(index)`, `createPlace(name?)`, `createTransport()`
- `tripMutations.ts` : `patchTrip`, `addStage/updateStage/removeStage/moveStage`, `setAccommodation`, `addPlace/updatePlace/removePlace`, `setTransportLeg/updateTransportLeg/removeTransportLeg` (jambe entre étapes), `addTransport/updateTransport/removeTransport` (trajets libres)

## Endpoints API (`server/index.ts`, préfixe `/api`)

| Méthode | Route | Description |
|--------|-------|-------------|
| GET | `/api/trips` | Liste résumée (`TripSummary[]`) |
| POST | `/api/trips` | Crée un voyage. Body vide → voyage d'exemple (`server/defaultTrip.ts`) |
| GET | `/api/trips/:id` | Récupère un voyage complet |
| PUT | `/api/trips/:id` | Remplace les données (autosave). Conserve `id/createdAt` |
| DELETE | `/api/trips/:id` | Supprime |

## Routes front (`src/App.tsx`)

| Route | Page | Rôle |
|-------|------|------|
| `/` | `HomePage` | Liste + création/suppression de voyages |
| `/trip/:id` | `TripPage` | Vue carte + sidebar + panneau d'édition |

## Hooks (`src/presentation/hooks/`)

| Hook | Rôle |
|------|------|
| `useTrip(id)` | Charge le voyage, expose `mutate(updater)` + `saveStatus`. **Autosave débouncé 700 ms** + flush sur `beforeunload` |
| `useDebouncedValue(value, ms)` | Débounce générique |
| `useGeocodeSearch(query)` | Autocomplétion Nominatim débouncée (400 ms) + annulable (AbortController) |
| `useMediaQuery(q)` / `useIsMobile()` | Réactif au resize ; `useIsMobile` = `(max-width: 767px)` → lecture seule |
| `useTheme()` (`ThemeProvider`) | Thème clair/sombre, persisté, applique la classe `dark` |

## Patterns & conventions

- **Mutations pures** : jamais de mutation directe du Trip. Toujours `mutate((t) => mutationPure(t, …))`. L'autosave observe l'état renvoyé.
- **Client HTTP centralisé** (`httpClient`) : pas de `fetch` direct dans les composants (sauf géocodage externe, hors API interne).
- **UI** : composants primitifs maison (`Button/Input/Textarea/Select/Field`) — ne pas mélanger avec une autre lib de composants.
- **Sélection** (`src/presentation/types.ts`) : `Selection` (stage/place/**leg**/transports) + `PlacingTarget` (placement au clic sur la carte). `leg` = transport `stage.transportToNext`, édité dans `TransportLegEditor`.
- **Champs transport réutilisés** : `TransportFields` sert au panneau « Autres trajets » et à l'éditeur de jambe (`hideLabel` pour ce dernier).
- **Mobile lecture seule** : `MobileTripView` rend tout l'itinéraire sans inputs. `TripPage` bascule via `useIsMobile()` avant de calculer l'état d'édition.

## Points d'attention (pièges)

- ⚠️ **Traduction des labels de carte** : impossible en tuiles raster (noms locaux). On utilise des styles **vectoriels** (CARTO GL) et on réécrit `text-field` de chaque couche `symbol` via `applyMapLanguage` (`mapStyle.ts`). À rappeler **au chargement ET au changement de thème** : on écoute `map.once('idle', …)` (pas `styledata`, qui reboucle car `setLayoutProperty` le redéclenche).
- ⚠️ **react-map-gl** : les enfants de `<Map>` sont des `Marker`/`Source`/`Layer`. Les marqueurs sont des **composants React** (`pins.tsx`). Sur `Marker.onClick`, appeler `e.originalEvent.stopPropagation()` pour ne pas déclencher le `onClick` de la carte (mode placement).
- ⚠️ **Chunk maplibre-gl ~800 kB** : warning de build attendu (lib carto volumineuse), pas bloquant.
- ⚠️ **Marqueur de transport** : placé au **milieu** du segment entre deux hébergements géolocalisés ; n'apparaît que si `transportToNext` **et** les deux locations existent.
- ⚠️ **Nominatim** : usage raisonnable (≈1 req/s), toujours débouncer (`useGeocodeSearch`) et fournir un `accept-language`.
- ⚠️ **`node:sqlite`** (choisi car `better-sqlite3` échoue à compiler sous Windows sans Visual Studio Build Tools) : dispo dans Node 24 **sans flag**, émet juste un `ExperimentalWarning`. API proche de better-sqlite3 mais `prepare()` **sans generics** et `.get()/.all()` renvoient `Record<string,SQLOutputValue>` → caster via `as unknown as TripRow`.
- ⚠️ **`npm start` a besoin de `tsx`** (dép. de dev) au runtime : l'image Docker copie tout `node_modules` depuis l'étape build.
- ⚠️ **`FitBounds`** ne recadre qu'au **changement de `trip.id`** (pas à chaque édition), sinon la carte saute pendant qu'on édite.
- Le voyage est un **blob JSON** : pas de requêtes SQL par sous-entité. Toute évolution du modèle est rétro-compatible tant qu'on gère les champs optionnels/absents.
