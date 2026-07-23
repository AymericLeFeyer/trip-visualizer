import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { DetailContent, type DetailContentProps } from './DetailContent';

const WIDTH_KEY = 'trip-visualizer.drawerWidth';
const MIN_WIDTH = 300;
const MAX_WIDTH = 760;
const DEFAULT_WIDTH = 360;

function loadWidth(): number {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(WIDTH_KEY) : null;
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value)) : DEFAULT_WIDTH;
}

/**
 * Tiroir latéral desktop **redimensionnable** (poignée sur le bord droit).
 * Empilable : `TripPage` en rend un par élément de la pile de sélection
 * (sidebar → étape → lieu), la carte reste à droite. Masqué pendant un placement.
 * Les étapes sont rendues en **colonne simple** (`compact`) pour tenir dans le tiroir.
 * La largeur choisie est mémorisée dans `localStorage` (défaut des prochains tiroirs).
 */
export function DetailDrawer(props: DetailContentProps) {
  const { selection, placingTarget } = props;
  const [width, setWidth] = useState<number>(loadWidth);
  const asideRef = useRef<HTMLElement>(null);

  const open = selection !== null && placingTarget === null;
  if (!open) return null;

  const startResize = (e: ReactPointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = asideRef.current?.offsetWidth ?? width;
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + (ev.clientX - startX)));
      setWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
      const finalW = asideRef.current?.offsetWidth;
      if (finalW) localStorage.setItem(WIDTH_KEY, String(finalW));
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <aside
      ref={asideRef}
      style={{ width }}
      className="relative grid grid-rows-1 h-full shrink-0 overflow-hidden border-r border-border bg-card"
    >
      <DetailContent {...props} compact />

      {/* Poignée de redimensionnement (bord droit) */}
      <div
        onPointerDown={startResize}
        title="Redimensionner"
        className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-primary/30"
      />
    </aside>
  );
}
