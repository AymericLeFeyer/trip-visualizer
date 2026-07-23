import { Modal } from '../ui/Modal';
import { DetailContent, type DetailContentProps } from './DetailContent';

/**
 * Modale de détail/édition (utilisée sur mobile pour l'édition).
 * Se masque pendant un placement sur carte, puis réapparaît.
 * Le desktop utilise `DetailDrawer` à la place.
 */
export function DetailModal(props: DetailContentProps) {
  const { selection, placingTarget, onClose } = props;
  // Masquée tant qu'on place un point sur la carte (mais la sélection est conservée).
  const open = selection !== null && placingTarget === null;
  // Étape (édition ou lecture) = 2 colonnes sur desktop → modale large (~70 % écran).
  const wide = selection?.kind === 'stage';

  return (
    <Modal open={open} onClose={onClose} className={wide ? 'w-[92vw] md:w-[70vw]' : undefined}>
      <DetailContent {...props} />
    </Modal>
  );
}
