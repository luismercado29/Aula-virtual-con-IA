'use client';

import { ThumbsDown } from 'lucide-react';
import { useState, useTransition } from 'react';

import { noMeInteresaAccion } from '@/app/acciones/recomendaciones';

/** Retroalimentacion explicita: ensena a la IA y oculta el curso. */
export function NoMeInteresa({ cursoId, titulo }: { cursoId: number; titulo: string }) {
  const [hecho, setHecho] = useState(false);
  const [pendiente, startTransition] = useTransition();
  if (hecho) {
    return (
      <p role="status" className="absolute inset-0 z-10 grid place-items-center bg-superficie/95 p-6 text-center font-semibold">
        Entendido: te recomendaremos menos cursos como «{titulo}».
      </p>
    );
  }
  return (
    <button type="button" disabled={pendiente}
      onClick={() => startTransition(async () => { await noMeInteresaAccion(cursoId); setHecho(true); })}
      className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-tinta opacity-100 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
      aria-label={`No me interesa «${titulo}»`} title="No me interesa">
      <ThumbsDown className="size-4" aria-hidden="true" />
    </button>
  );
}
