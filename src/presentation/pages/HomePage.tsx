import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPinned, Plus, Trash2 } from 'lucide-react';
import type { TripSummary } from '@shared/types/trip';
import { tripRepository } from '@/infrastructure/trip/HttpTripRepository';
import { Button } from '@/presentation/components/ui/Button';

export function HomePage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    tripRepository
      .list()
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const trip = await tripRepository.create();
      navigate(`/trip/${trip.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await tripRepository.remove(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="mx-auto min-h-full max-w-2xl px-6 py-14">
      <header className="mb-10 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MapPinned className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Trip Visualizer</h1>
          <p className="text-sm text-muted-foreground">
            Visualise et personnalise tes voyages sur une carte.
          </p>
        </div>
      </header>

      <Button onClick={handleCreate} disabled={creating} className="mb-8">
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Nouveau voyage
      </Button>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : trips.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Aucun voyage pour l'instant. Crée ton premier voyage !
        </p>
      ) : (
        <ul className="space-y-2">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                <div className="truncate font-medium">{trip.title}</div>
                <div className="text-xs text-muted-foreground">
                  {trip.stageCount} étape{trip.stageCount > 1 ? 's' : ''} · modifié le{' '}
                  {new Date(trip.updatedAt).toLocaleDateString('fr-FR')}
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() => handleDelete(trip.id)}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
