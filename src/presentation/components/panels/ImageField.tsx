import { Shuffle, X } from 'lucide-react';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ImageFieldProps {
  imageUrl?: string;
  /** Mots-clés pour l'image au hasard (nom du lieu/étape, éventuellement adresse). */
  query: string;
  onChange: (url: string | undefined) => void;
}

/**
 * Construit une URL d'image « au hasard » depuis le web selon des mots-clés.
 * Google Images n'a pas d'API gratuite/sans clé → on interroge LoremFlickr
 * (photos Flickr, sans clé). Résultat aléatoire : « avec un peu de chance »
 * la photo correspond bien au lieu. `lock` force une image différente à chaque clic.
 */
function randomImageUrl(query: string): string {
  const keywords = query
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(',');
  const tags = encodeURIComponent(keywords || 'travel');
  const lock = Math.floor(Math.random() * 100_000);
  return `https://loremflickr.com/640/480/${tags}?lock=${lock}`;
}

/** Champ image réutilisable (lieu / étape) : aperçu + URL manuelle + image au hasard. */
export function ImageField({ imageUrl, query, onChange }: ImageFieldProps) {
  return (
    <Field label="Image">
      <div className="space-y-2">
        {imageUrl && (
          <div className="group relative overflow-hidden rounded-lg border border-border">
            <img
              src={imageUrl}
              alt=""
              className="h-40 w-full bg-muted object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              title="Retirer l'image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={imageUrl ?? ''}
            placeholder="Coller une URL d'image…"
            onChange={(e) => onChange(e.target.value || undefined)}
          />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            title="Charger une photo au hasard depuis le web selon le nom"
            onClick={() => onChange(randomImageUrl(query))}
          >
            <Shuffle className="h-4 w-4" /> Au hasard
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          « Au hasard » cherche une photo du web selon le nom (résultat aléatoire — reclique pour
          une autre).
        </p>
      </div>
    </Field>
  );
}
