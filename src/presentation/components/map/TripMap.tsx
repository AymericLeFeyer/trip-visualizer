import { useCallback, useEffect, useMemo, useRef } from 'react';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import type { LatLng, Trip } from '@shared/types/trip';
import { TRANSPORT_MODES } from '@/shared/constants/catalog';
import { useTheme } from '@/presentation/theme/ThemeProvider';
import { LegPin, PlacePin, StagePin } from './pins';
import { applyMapLanguage, MAP_STYLE_URLS } from './mapStyle';

interface TripMapProps {
  trip: Trip;
  selectedStageId: string | null;
  selectedPlaceId: string | null;
  selectedLegStageId: string | null;
  placingMode: boolean;
  onSelectStage: (stageId: string) => void;
  onSelectPlace: (stageId: string, placeId: string) => void;
  onSelectLeg: (stageId: string) => void;
  onMapClick: (location: LatLng) => void;
}

const JAPAN_VIEW = { longitude: 138.2529, latitude: 36.2048, zoom: 5 };

function collectPoints(trip: Trip): LatLng[] {
  const points: LatLng[] = [];
  for (const stage of trip.stages) {
    if (stage.accommodation?.location) points.push(stage.accommodation.location);
    for (const place of stage.places) {
      if (place.location) points.push(place.location);
    }
  }
  return points;
}

function midpoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

export function TripMap({
  trip,
  selectedStageId,
  selectedPlaceId,
  selectedLegStageId,
  placingMode,
  onSelectStage,
  onSelectPlace,
  onSelectLeg,
  onMapClick,
}: TripMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const points = useMemo(() => collectPoints(trip), [trip]);

  // Itinéraire ordonné entre les nuits.
  const routeData = useMemo<FeatureCollection<LineString>>(() => {
    const coords = trip.stages
      .map((s) => s.accommodation?.location)
      .filter((l): l is LatLng => Boolean(l))
      .map((l) => [l.lng, l.lat] as [number, number]);
    return {
      type: 'FeatureCollection',
      features:
        coords.length > 1
          ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }]
          : [],
    };
  }, [trip.stages]);

  // Liens en pointillés entre chaque nuit et ses lieux satellites.
  const linkData = useMemo<FeatureCollection<LineString>>(() => {
    const features: FeatureCollection<LineString>['features'] = [];
    for (const stage of trip.stages) {
      const base = stage.accommodation?.location;
      if (!base) continue;
      for (const place of stage.places) {
        if (!place.location) continue;
        features.push({
          type: 'Feature',
          properties: { color: stage.color },
          geometry: {
            type: 'LineString',
            coordinates: [
              [base.lng, base.lat],
              [place.location.lng, place.location.lat],
            ],
          },
        });
      }
    }
    return { type: 'FeatureCollection', features };
  }, [trip.stages]);

  const fitToTrip = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || points.length === 0) return;
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 70, maxZoom: 13, duration: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  // Recadrer uniquement au changement de voyage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fitToTrip, [trip.id]);

  // (Ré)appliquer la traduction des labels au chargement et au changement de thème.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const run = () => applyMapLanguage(map);
    if (map.isStyleLoaded()) run();
    else map.once('idle', run);
  }, [theme]);

  return (
    <Map
      ref={mapRef}
      initialViewState={JAPAN_VIEW}
      mapStyle={MAP_STYLE_URLS[theme]}
      cursor={placingMode ? 'crosshair' : undefined}
      style={{ width: '100%', height: '100%' }}
      onLoad={() => {
        const map = mapRef.current?.getMap();
        if (map) applyMapLanguage(map);
        fitToTrip();
      }}
      onClick={(e) => {
        if (placingMode) onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }}
    >
      <Source id="route" type="geojson" data={routeData}>
        <Layer
          id="route-line"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': '#64748b', 'line-width': 3, 'line-opacity': 0.55 }}
        />
      </Source>

      <Source id="links" type="geojson" data={linkData}>
        <Layer
          id="link-line"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 1.5,
            'line-opacity': 0.5,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>

      {/* Marqueurs de transport au milieu de chaque jambe de trajet */}
      {trip.stages.map((stage, index) => {
        const from = stage.accommodation?.location;
        const to = trip.stages[index + 1]?.accommodation?.location;
        if (!stage.transportToNext || !from || !to) return null;
        const mid = midpoint(from, to);
        return (
          <Marker
            key={`leg-${stage.id}`}
            longitude={mid.lng}
            latitude={mid.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectLeg(stage.id);
            }}
          >
            <LegPin
              emoji={TRANSPORT_MODES[stage.transportToNext.mode].emoji}
              selected={selectedLegStageId === stage.id}
            />
          </Marker>
        );
      })}

      {/* Lieux satellites */}
      {trip.stages.flatMap((stage) =>
        stage.places
          .filter((p) => p.location)
          .map((p) => (
            <Marker
              key={p.id}
              longitude={p.location!.lng}
              latitude={p.location!.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelectPlace(stage.id, p.id);
              }}
            >
              <PlacePin color={stage.color} visited={p.visited} selected={selectedPlaceId === p.id} />
            </Marker>
          )),
      )}

      {/* Étapes (nuits) */}
      {trip.stages.map((stage, index) => {
        const base = stage.accommodation?.location;
        if (!base) return null;
        return (
          <Marker
            key={stage.id}
            longitude={base.lng}
            latitude={base.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectStage(stage.id);
            }}
          >
            <StagePin order={index + 1} color={stage.color} selected={selectedStageId === stage.id} />
          </Marker>
        );
      })}
    </Map>
  );
}
