import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type SheetSnap = 'peek' | 'half' | 'full';

interface MobileSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Zone toujours visible sous la poignée (rail d'étapes). */
  rail: ReactNode;
  children: ReactNode;
}

const FRACTION: Record<SheetSnap, number> = { full: 0.9, half: 0.5, peek: 0.22 };

/**
 * Bottom sheet à trois crans (peek / half / full), déplaçable au doigt via la
 * poignée. On pilote la **hauteur** (pas un translate) pour que le contenu qui
 * dépasse défilé réellement dans la zone visible.
 */
export function MobileSheet({ snap, onSnapChange, rail, children }: MobileSheetProps) {
  const [vh, setVh] = useState(() => window.innerHeight);
  const [height, setHeight] = useState(() => window.innerHeight * FRACTION[snap]);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const heightFor = useCallback((s: SheetSnap) => vh * FRACTION[s], [vh]);

  // Aligne la hauteur sur le cran demandé (hors interaction de drag).
  useEffect(() => {
    if (!dragging) setHeight(heightFor(snap));
  }, [snap, dragging, heightFor]);

  const nearestSnap = (px: number): SheetSnap => {
    const entries: [SheetSnap, number][] = [
      ['full', heightFor('full')],
      ['half', heightFor('half')],
      ['peek', heightFor('peek')],
    ];
    return entries.reduce((best, cur) =>
      Math.abs(cur[1] - px) < Math.abs(best[1] - px) ? cur : best,
    )[0];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, startHeight: height };
    moved.current = false;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dy) > 6) moved.current = true;
    // Tirer vers le haut (dy < 0) agrandit le sheet.
    setHeight(Math.min(Math.max(drag.current.startHeight - dy, vh * 0.14), vh * 0.92));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const target = nearestSnap(height);
    drag.current = null;
    setDragging(false);
    onSnapChange(target);
    setHeight(heightFor(target));
  };
  // Un vrai drag ne doit pas aussi déclencher le tap (toggle) de la poignée.
  const onHandleClick = () => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    onSnapChange(snap === 'full' ? 'half' : 'full');
  };

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-[900] flex flex-col rounded-t-2xl border border-border bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.18)]',
        !dragging && 'transition-[height] duration-300 ease-out motion-reduce:transition-none',
      )}
      style={{ height }}
    >
      {/* Poignée : zone de drag + tap pour dérouler */}
      <div
        className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onHandleClick}
      >
        <span className="h-1.5 w-10 rounded-full bg-border" />
      </div>

      <div className="shrink-0">{rail}</div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-1 scroll-thin">
        {children}
      </div>
    </div>
  );
}
