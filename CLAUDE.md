# CLAUDE.md — Trip Visualizer

> Dernière mise à jour : 2026-07-22

App web pour visualiser un voyage (Japon) sur une carte : étapes ordonnées (nuits) + lieux satellites sans ordre. Autosave, partage par lien, **sans authentification**.

## Deux modes (visualisation / admin)

- **Visualisation** (par défaut, desktop **et** mobile) : lecture seule. Clic sur un marqueur/étape → **modale de détail** en lecture seule. Aucun bouton d'ajout/suppression.
- **Admin** : édition partout (desktop et mobile). Déverrouillé par un **cadenas** (`AdminLock`) + saisie du code `SRAPIX` (`src/shared/constants/admin.ts`). État `isAdmin` persisté dans `localStorage` (clé `trip-visualizer.admin`) via `AdminModeProvider` (`src/presentation/mode/`).
- ⚠️ Le code est une **barrière côté client uniquement** (pas d'auth serveur) : empêche l'édition accidentelle, pas un utilisateur déterminé.

## Stack

- Front : **React 18 + Vite + TypeScript strict**, DDD, **Tailwind** (composants type shadcn/ui faits main dans `src/presentation/components/ui/`)
- Carte : **MapLibre GL + react-map-gl** (`react-map-gl/maplibre`), styles **vectoriels CARTO GL** (gratuits, sans clé) : `voyager` (clair) / `dark-matter` (sombre). Labels forcés en **français** via `setLayoutProperty`.
- **Thème clair/sombre** : `ThemeProvider` (classe `dark` sur `<html>`, persisté localStorage). Primary = **bleu**.
- **Responsive** : mobile (<768px) = **lecture seule** (`MobileTripView`), tablette et + = éditable (`useIsMobile`).
- Autocomplétion adresses : **Nominatim** (OSM), gratuit, sans clé (`src/infrastructure/geocoding/nominatim.ts`)
- Back : **Express + `node:sqlite`** (SQLite embarqué dans Node 24, aucun module natif à compiler), exécuté via **tsx** (pas de compilation JS du serveur)
- Le voyage complet est stocké **en document JSON** dans une seule table `trips` (pas de modèle relationnel éclaté)

## Commandes

- `npm run dev` : Vite (5173) + serveur tsx watch (42069) via `concurrently`. Proxy `/api` → 42069.
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
src/presentation/            # pages/, components/ (map, panels, details, ui), hooks/, mode/, theme/, types.ts
```

- `presentation/mode/AdminModeProvider.tsx` : contexte du mode admin (`useAdminMode`).
- `presentation/components/details/` : vues **lecture seule** partagées modale + mobile (`StageDetail`, `PlaceDetail`, `LegDetail`, `TransportsDetail`, `parts.tsx` = `AccommodationBlock`/`PlaceLine`/`InfoLine`/`MapsLink`/`DetailHeader`).
- `presentation/components/panels/` : éditeurs (formulaires, mode admin) + `DetailModal` (aiguilleur visu/admin).

## Domaine `trip`

### Entités (`shared/types/trip.ts`)
- **Trip** : `id, title, description?, stages[], transports[], createdAt, updatedAt`
- **Stage** (étape/nuit) : `id, name, color, emoji?, accommodation?, places[], transportToNext?, notes?` — `transportToNext` = jambe de trajet vers l'étape suivante ; `emoji?` s'affiche dans le marqueur (sinon le numéro)
- **Accommodation** : `name, address?, location?{lat,lng}, googleMapsUrl?, checkInDate?, checkOutDate?, arrivalTime?, departureTime?, modalities?, notes?`
- **Place** (lieu satellite) : `id, name, category, address?, location?, googleMapsUrl?, notes?, visited`
- **Transport** : `id, mode, label, from?, to?, date?, departureTime?, arrivalTime?, distanceKm?, reference?, price?, currency?, notes?` — `mode` inclut `car`. Seul usage restant : **jambe entre étapes** (`stage.transportToNext`).
- **Flight** (`trip.outboundFlight?` / `trip.returnFlight?`) : `airport?, airportLocation?, date?, legs[], price?, currency?, notes?`. `airport(Location)` = aéroport du **pays visité** affiché sur la carte (arrivée pour l'aller, départ pour le retour).
- **FlightLeg** (segment / correspondance) : `id, flightNumber?, from?, to?, departureTime?, arrivalTime?`
- ⚠️ Le système de « trajets libres » (`trip.transports[]`, `TransportPanel`, « Autres trajets ») a été **supprimé** au profit des vols aller/retour.
- `TripInput = Omit<Trip,'id'|'createdAt'|'updatedAt'>`

### Repository (`src/domain/trip/repositories/TripRepository.ts`)
`list()`, `getById(id)`, `create(input?)`, `update(id, input)`, `remove(id)`. Impl HTTP : `src/infrastructure/trip/HttpTripRepository.ts` (instance `tripRepository`).

### Services domaine (purs, renvoient un nouveau Trip)
- `tripFactory.ts` : `createStage(index)`, `createPlace(name?)`, `createTransport()`, `createFlight()`, `createFlightLeg()`
- `tripMutations.ts` : `patchTrip`, `addStage/updateStage/removeStage/moveStage`, `setAccommodation`, `addPlace/updatePlace/removePlace`, `setTransportLeg/updateTransportLeg/removeTransportLeg` (jambe entre étapes), `setFlight/removeFlight/addFlightLeg/updateFlightLeg/removeFlightLeg` (vols, `FlightSide = 'outbound' | 'return'`)

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
| `/trip/:id` | `TripPage` | Vue carte + sidebar (ou liste mobile) + modale de détail/édition |

## Hooks (`src/presentation/hooks/`)

| Hook | Rôle |
|------|------|
| `useTrip(id)` | Charge le voyage, expose `mutate(updater)` + `saveStatus`. **Autosave débouncé 700 ms** + flush sur `beforeunload` |
| `useDebouncedValue(value, ms)` | Débounce générique |
| `useGeocodeSearch(query)` | Autocomplétion Nominatim débouncée (400 ms) + annulable (AbortController) |
| `useMediaQuery(q)` / `useIsMobile()` | Réactif au resize ; `useIsMobile` = `(max-width: 767px)` → choisit le **layout** (liste vs sidebar). **N'autorise plus l'édition** : c'est `isAdmin` qui décide |
| `useTheme()` (`ThemeProvider`) | Thème clair/sombre, persisté, applique la classe `dark` |
| `useAdminMode()` (`AdminModeProvider`) | `{ isAdmin, unlock(code), lock() }`. Persisté localStorage. `unlock` renvoie `true` si le code = `SRAPIX` |

## Patterns & conventions

- **Mutations pures** : jamais de mutation directe du Trip. Toujours `mutate((t) => mutationPure(t, …))`. L'autosave observe l'état renvoyé.
- **Client HTTP centralisé** (`httpClient`) : pas de `fetch` direct dans les composants (sauf géocodage externe, hors API interne).
- **UI** : composants primitifs maison (`Button/Input/Textarea/Select/Field`) — ne pas mélanger avec une autre lib de composants.
- **Sélection** (`src/presentation/types.ts`) : `Selection` (stage/place/**leg**/**flight**) + `PlacingTarget` (accommodation/place/**flightAirport**). `leg` = `stage.transportToNext` (`TransportLegEditor`) ; `flight` = vol aller/retour (`FlightEditor`/`FlightDetail`).
- **Vols aller/retour** : rendus comme des « étapes bout de voyage » — entrée en **haut** (aller) et en **bas** (retour) de la sidebar/mobile. En admin, un clic crée le vol à la volée (`selectFlight` dans `TripPage`). Sur la carte : marqueur `FlightPin` (✈️) à `airportLocation`, et le tracé va **aéroport aller → nuits → aéroport retour**.
- **Champs transport** : `TransportFields` (jambe uniquement, `hideLabel`). Avec `from`/`to` géolocalisés, un bouton **calcule la distance** (`haversineKm`, `shared/lib/geo.ts`) → remplit `distanceKm`.
- **Édition = modale, pas panneau latéral** : `DetailModal` (`panels/`) est rendu **une fois** par `TripPage` (au-dessus des layouts desktop/mobile) dans la primitive `ui/Modal`. Selon `isAdmin` il rend l'**éditeur** (formulaire) ou la **vue détail** lecture seule. Éditeurs = root `flex min-h-0 flex-col`, header `shrink-0`, corps `flex-1 min-h-0 overflow-y-auto` (pattern scroll dans une modale `max-h-[85vh]`).
- **Placement sur carte depuis la modale** : la modale se **masque** tant que `placingTarget !== null` (`open = selection && !placingTarget`), le bandeau « Clique sur la carte » reste, puis `setPlacingTarget(null)` la rouvre. Aucun state supplémentaire.
- **Lieux cliquables** : dans une étape (`StageDetail`/`StageEditor`), cliquer un lieu appelle `onSelectPlace` → ouvre la modale du lieu. `PlaceLine` devient un bouton quand on lui passe `onClick`.
- **Bouton « Focus »** (`FocusButton`, `details/parts.tsx`) présent dans chaque modale ayant une localisation (étape=hébergement, lieu, jambe=milieu des 2 hébergements). Il appelle `onFocus(location)` → `TripPage.focusOnMap` qui **ferme la modale** et pousse un `focusTarget={location, nonce}`. `TripMap` réagit au `nonce` par un `flyTo` (zoom 14). Le `nonce` (horodatage) permet de re-focaliser le même point. `focusTarget.bottomInset` (px) ajoute un `padding` bas au `flyTo` = hauteur visible du bottom sheet mobile, pour que le point ne soit pas masqué (calculé par `MobileTripView.sheetInset` selon le cran).
- **Sélection carte** : `deriveMapSelection(selection)` (`presentation/types.ts`) calcule les ids surlignés — partagé desktop/mobile.
- **Résumé transport** : `formatTransportSummary(t)` (`shared/lib/transport.ts`) → « 320 km · 09:12–11:30 · 13320¥ ». Utilisé sidebar, mobile, `LegDetail`.
- **Format des dates (lecture seule)** : `formatLongDate(iso)` (`src/shared/lib/date.ts`) → « lundi 16 janvier 2026 » (`Intl.DateTimeFormat('fr-FR')`, forcé midi UTC pour éviter le décalage de fuseau). Les inputs restent en `<input type="date">` (ISO `YYYY-MM-DD`) ; le format long ne s'applique **qu'à l'affichage** (séjour hébergement `AccommodationBlock` + mobile, `FlightDetail`, `LegDetail`).
- **Durée d'étape (nuits)** : `nightsBetween(checkIn, checkOut)` / `nightsLabel(...)` (`src/shared/lib/date.ts`) → « 3 nuits » calculé depuis `accommodation.checkInDate/checkOutDate`. Affiché en **badge** à côté du nom de l'étape au clic (`StageDetail` desktop dans le titre, `StageContent` mobile dans le header). `null` si l'une des deux dates manque.
- **Distance lieu ↔ étape** : `distanceLabel(origin, target)` / `formatDistanceKm(km)` (`src/shared/lib/geo.ts`) → estime à vol d'oiseau (Haversine) la distance d'un lieu au **point de l'étape** (`stage.accommodation?.location`). Affichée en petit à côté du nom du lieu (`PlaceLine` desktop via prop `origin`, `PlaceCard` mobile) **et** dans le détail (`PlaceDetail` `InfoLine`, `PlaceContent` mobile → « … de l'hébergement »). `null` si l'hébergement ou le lieu n'a pas de `location`.
- **Mobile = carte plein écran + bottom sheet** (`MobileTripView`, pensé usage terrain au Japon) :
  - Carte en `absolute inset-0`, barre supérieure flottante translucide, `MobileSheet` (`components/mobile/`) à 3 crans **peek/half/full** déplaçable au doigt (pointer events, garde anti-tap après drag).
  - **Rail d'étapes** horizontal en tête du sheet (pills ✈️ Aller · étapes colorées · ✈️ Retour · + Étape) → navigue et recadre la carte (`flyTo` local, seedé par `focusTarget`).
  - **Bidirectionnel & sans modale** : les taps sur la carte pilotent **toujours** le sheet (les deux modes), jamais de modale. `Active = stage | place | flight` : tap sur une étape → contenu d'étape + zoom ; tap sur un lieu → **détail du lieu dans le sheet** (`PlaceContent`, avec retour à l'étape). Le sheet recadre réciproquement la carte et surligne le marqueur (`selectedStageId/PlaceId/Flight` dérivés de `active` ⊕ `mapSelection`).
  - **Édition** = boutons crayon dans le sheet (`onSelectStage/Place/Flight` → modale `DetailModal`) — action délibérée, pas un tap carte. **FAB `+`** ouvre `QuickAddPlace` (capture rapide nom/adresse autocomplétée/lien/catégorie, option « enregistrer et continuer »).
  - `MobileTripView` passe ses **propres handlers** à `TripMap` (≠ ceux de `TripPage`, qui eux ouvrent la modale sur desktop).
- **Étape desktop = 2 colonnes (édition ET lecture)** : `StageEditor` et `StageDetail` en `md:grid-cols-2` (gauche = détails + hébergement, droite = lieux). `DetailModal` élargit la modale à **~70 % de l'écran** (`w-[92vw] md:w-[70vw]`) dès que `selection.kind === 'stage'`. La primitive `Modal` : `className` fournie **remplace** la largeur par défaut (`w-full max-w-md`) pour éviter les conflits de classes Tailwind.
- **Emoji de lieu** : le marqueur (`PlacePin`) affiche `PLACE_CATEGORIES[category].emoji` dans une pastille (bordure = couleur d'étape), plus de rond nu.
- **Ouvrir dans Google Maps** : `MapsSearchButton` (`details/parts.tsx`) + `mapsSearchUrl(query)` (`shared/lib/maps.ts`) construisent une URL de recherche Maps depuis l'**adresse** (fallback nom). Présent sur l'hébergement d'étape (`AccommodationBlock`, `LocationField`) et sur les lieux (`PlaceDetail`, `PlaceEditor` via `LocationField`, mobile). ≠ `googleMapsUrl` (lien manuel saisi).

## Points d'attention (pièges)

- ⚠️ **Traduction des labels de carte** : impossible en tuiles raster (noms locaux). On utilise des styles **vectoriels** (CARTO GL) et on réécrit `text-field` de chaque couche `symbol` via `applyMapLanguage` (`mapStyle.ts`). À rappeler **au chargement ET au changement de thème** : on écoute `map.once('idle', …)` (pas `styledata`, qui reboucle car `setLayoutProperty` le redéclenche).
- ⚠️ **react-map-gl** : les enfants de `<Map>` sont des `Marker`/`Source`/`Layer`. Les marqueurs sont des **composants React** (`pins.tsx`). Sur `Marker.onClick`, appeler `e.originalEvent.stopPropagation()` pour ne pas déclencher le `onClick` de la carte (mode placement).
- ⚠️ **Chunk maplibre-gl ~800 kB** : warning de build attendu (lib carto volumineuse), pas bloquant.
- ⚠️ **Marqueur de transport** : placé au **milieu** du segment entre deux hébergements géolocalisés ; n'apparaît que si `transportToNext` **et** les deux locations existent.
- ⚠️ **`map.flyTo` + `padding`** : ne **jamais** passer `padding: undefined` (maplibre v4 lève → l'effet plante → écran grisé). N'ajouter la clé `padding` que si un inset est réellement fourni. C'est le cas desktop (pas d'inset) vs mobile (inset = hauteur du bottom sheet).
- ⚠️ **Nominatim** : usage raisonnable (≈1 req/s), toujours débouncer (`useGeocodeSearch`) et fournir un `accept-language`.
- ⚠️ **`node:sqlite`** (choisi car `better-sqlite3` échoue à compiler sous Windows sans Visual Studio Build Tools) : dispo dans Node 24 **sans flag**, émet juste un `ExperimentalWarning`. API proche de better-sqlite3 mais `prepare()` **sans generics** et `.get()/.all()` renvoient `Record<string,SQLOutputValue>` → caster via `as unknown as TripRow`.
- ⚠️ **`npm start` a besoin de `tsx`** (dép. de dev) au runtime : l'image Docker copie tout `node_modules` depuis l'étape build.
- ⚠️ **`FitBounds`** ne recadre qu'au **changement de `trip.id`** (pas à chaque édition), sinon la carte saute pendant qu'on édite.
- Le voyage est un **blob JSON** : pas de requêtes SQL par sous-entité. Toute évolution du modèle est rétro-compatible tant qu'on gère les champs optionnels/absents.
