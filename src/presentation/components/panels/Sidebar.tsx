import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Cloud, CloudOff, Loader2, Plus, Share2, Train } from 'lucide-react';
import type { Stage, Trip } from '@shared/types/trip';
import { TRANSPORT_MODES } from '@/shared/constants/catalog';
import { createStage, createTransport } from '@/domain/trip/services/tripFactory';
import { addStage, patchTrip, setTransportLeg } from '@/domain/trip/services/tripMutations';
import type { SaveStatus } from '@/presentation/hooks/useTrip';
import type { Selection } from '@/presentation/types';
import { cn } from '@/shared/lib/cn';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';

interface SidebarProps {
  trip: Trip;
  selection: Selection;
  saveStatus: SaveStatus;
  mutate: (updater: (trip: Trip) => Trip) => void;
  onSelectStage: (stageId: string) => void;
  onSelectLeg: (stageId: string) => void;
  onSelectTransports: () => void;
}

function legSummary(stage: Stage): string {
  const leg = stage.transportToNext;
  if (!leg) return '';
  const parts: string[] = [];
  if (leg.departureTime || leg.arrivalTime) {
    parts.push([leg.departureTime, leg.arrivalTime].filter(Boolean).join('–'));
  }
  if (leg.price != null) parts.push(`${leg.price}${leg.currency ?? '¥'}`);
  return parts.join(' · ');
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map = {
    idle: { icon: <Cloud className="h-3.5 w-3.5" />, text: 'Synchronisé', cls: 'text-muted-foreground' },
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: 'Enregistrement…', cls: 'text-muted-foreground' },
    saved: { icon: <Check className="h-3.5 w-3.5" />, text: 'Enregistré', cls: 'text-green-600' },
    error: { icon: <CloudOff className="h-3.5 w-3.5" />, text: 'Erreur de sauvegarde', cls: 'text-red-600' },
  }[status];
  return (
    <span className={cn('flex items-center gap-1 text-xs', map.cls)}>
      {map.icon}
      {map.text}
    </span>
  );
}

export function Sidebar({
  trip,
  selection,
  saveStatus,
  mutate,
  onSelectStage,
  onSelectLeg,
  onSelectTransports,
}: SidebarProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  const handleAddStage = () => {
    const stage = createStage(trip.stages.length);
    mutate((t) => addStage(t, stage));
    onSelectStage(stage.id);
  };

  const handleAddLeg = (stageId: string) => {
    mutate((t) => setTransportLeg(t, stageId, createTransport()));
    onSelectLeg(stageId);
  };

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-card">
      <div className="space-y-2 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Mes voyages
          </Link>
          <div className="flex items-center gap-1">
            <SaveIndicator status={saveStatus} />
            <ThemeToggle />
          </div>
        </div>
        <input
          value={trip.title}
          onChange={(e) => mutate((t) => patchTrip(t, { title: e.target.value }))}
          className="w-full bg-transparent text-lg font-bold outline-none focus:ring-0"
          placeholder="Titre du voyage"
        />
        <textarea
          value={trip.description ?? ''}
          onChange={(e) => mutate((t) => patchTrip(t, { description: e.target.value }))}
          placeholder="Description…"
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-muted-foreground outline-none"
        />
        <Button variant="secondary" size="sm" className="w-full" onClick={handleShare}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? 'Lien copié !' : 'Partager le lien'}
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 scroll-thin">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Étapes
          </h2>
          <button
            onClick={handleAddStage}
            className="text-muted-foreground hover:text-foreground"
            title="Ajouter une étape"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {trip.stages.map((stage, index) => {
          const active = selection?.kind === 'stage' && selection.stageId === stage.id;
          const legActive = selection?.kind === 'leg' && selection.stageId === stage.id;
          const leg = stage.transportToNext;
          const isLast = index === trip.stages.length - 1;
          return (
            <Fragment key={stage.id}>
              <button
                onClick={() => onSelectStage(stage.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                )}
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: stage.color }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{stage.name}</div>
                  {stage.accommodation?.name && (
                    <div className="truncate text-xs text-muted-foreground">
                      🛏️ {stage.accommodation.name}
                    </div>
                  )}
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {stage.places.length} lieu{stage.places.length > 1 ? 'x' : ''} à visiter
                  </div>
                </div>
              </button>

              {/* Connecteur de transport vers l'étape suivante */}
              {!isLast && (
                <div className="flex items-center gap-2 pl-[26px]">
                  <div className="h-5 w-px shrink-0 bg-border" />
                  {leg ? (
                    <button
                      onClick={() => onSelectLeg(stage.id)}
                      className={cn(
                        'flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                        legActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                      )}
                    >
                      <span>{TRANSPORT_MODES[leg.mode].emoji}</span>
                      <span className="truncate text-muted-foreground">
                        {legSummary(stage) || TRANSPORT_MODES[leg.mode].label}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddLeg(stage.id)}
                      className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" /> transport
                    </button>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}

        {trip.stages.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Aucune étape. Ajoute ta première étape.
          </p>
        )}
      </div>

      <div className="border-t border-border p-3">
        <button
          onClick={onSelectTransports}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium transition-colors',
            selection?.kind === 'transports'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted',
          )}
        >
          <Train className="h-4 w-4 text-primary" />
          Transports & trains
          <span className="ml-auto text-xs text-muted-foreground">{trip.transports.length}</span>
        </button>
      </div>
    </aside>
  );
}
