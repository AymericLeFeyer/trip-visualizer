import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Theme } from '@/presentation/theme/ThemeProvider';

/** Styles vectoriels CARTO (gratuits, sans clé API). */
export const MAP_STYLE_URLS: Record<Theme, string> = {
  light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

/**
 * Force les libellés de la carte en français (repli latin puis nom local).
 * À rappeler à chaque chargement de style (changement de thème inclus).
 */
export function applyMapLanguage(map: MapLibreMap): void {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;
    const layout = layer.layout as { 'text-field'?: unknown } | undefined;
    if (!layout || !('text-field' in layout)) continue;
    try {
      map.setLayoutProperty(layer.id, 'text-field', [
        'coalesce',
        ['get', 'name:fr'],
        ['get', 'name:latin'],
        ['get', 'name_int'],
        ['get', 'name'],
      ]);
    } catch {
      /* certaines couches n'acceptent pas l'override : on ignore */
    }
  }
}
