import { cn } from '@/shared/lib/cn';
import { DetailContent, type DetailContentProps } from './DetailContent';

/**
 * Tiroir latéral desktop (remplace la modale) : s'ouvre entre la sidebar et la
 * carte quand un élément est sélectionné, la carte reste à droite. Masqué
 * pendant un placement sur carte pour laisser toute la place à la carte.
 * Le contenu (étape → lieu) se remplace, avec un bouton retour dans les éditeurs.
 */
export function DetailDrawer(props: DetailContentProps) {
  const { selection, placingTarget } = props;
  const open = selection !== null && placingTarget === null;
  if (!open) return null;

  // Étape = 2 colonnes → tiroir plus large ; lieu / jambe / vol = colonne simple.
  const wide = selection?.kind === 'stage';

  return (
    <aside
      className={cn(
        'grid grid-rows-1 h-full shrink-0 overflow-hidden border-r border-border bg-card shadow-lg',
        wide ? 'w-[38rem]' : 'w-[24rem]',
      )}
    >
      <DetailContent {...props} />
    </aside>
  );
}
