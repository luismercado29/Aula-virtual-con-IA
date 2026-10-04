'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Botones "anterior/siguiente" para quien usa mouse; el carril sigue siendo navegable con Tab. */
export function DesplazarCarril({ idCarril, etiqueta }: { idCarril: string; etiqueta: string }) {
  const mover = (dir: 1 | -1) => {
    const carril = document.getElementById(idCarril);
    if (!carril) return;
    const reducir = document.documentElement.classList.contains('reducir-movimiento')
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    carril.scrollBy({ left: dir * carril.clientWidth * 0.85, behavior: reducir ? 'auto' : 'smooth' });
  };
  return (
    <div className="hidden shrink-0 gap-2 sm:flex">
      <button type="button" className="boton boton-secundario size-11 p-0" onClick={() => mover(-1)} aria-controls={idCarril} aria-label={`Anteriores en ${etiqueta}`}>
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button type="button" className="boton boton-secundario size-11 p-0" onClick={() => mover(1)} aria-controls={idCarril} aria-label={`Siguientes en ${etiqueta}`}>
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
