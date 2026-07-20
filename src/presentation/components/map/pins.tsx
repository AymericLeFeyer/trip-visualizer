import { cn } from '@/shared/lib/cn';

/** Gros marqueur numéroté d'une étape (là où l'on dort). */
export function StagePin({
  order,
  color,
  selected,
}: {
  order: number;
  color: string;
  selected: boolean;
}) {
  return (
    <div
      className="marker-stage__pin"
      style={{
        background: color,
        boxShadow: selected
          ? '0 0 0 4px rgba(59,130,246,0.35),0 2px 6px rgba(0,0,0,0.35)'
          : undefined,
      }}
    >
      {order}
    </div>
  );
}

/** Petit marqueur d'un lieu satellite. */
export function PlacePin({
  color,
  visited,
  selected,
}: {
  color: string;
  visited: boolean;
  selected: boolean;
}) {
  return (
    <div
      className={cn('marker-place__dot', visited && 'marker-place__dot--visited')}
      style={{
        background: color,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.4)' : undefined,
        transform: selected ? 'scale(1.25)' : undefined,
      }}
    />
  );
}

/** Pastille du moyen de transport, au milieu d'une jambe de trajet. */
export function LegPin({ emoji, selected }: { emoji: string; selected: boolean }) {
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-sm shadow-md"
      style={{ boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.45)' : undefined }}
    >
      {emoji}
    </div>
  );
}
