'use client';

import { Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { IconoCategoria } from '../Iconos';

/** Cinta en movimiento con boton de pausa (WCAG 2.2.2: todo lo que se mueve mas de 5 s se puede detener). */
export function CintaCategorias({ categorias }: { categorias: { slug: string; nombre: string; icono: string; cursos: number }[] }) {
  const [pausada, setPausada] = useState(false);
  const elementos = (oculta: boolean) => categorias.map((c) => (
    <li key={`${c.slug}-${oculta}`} aria-hidden={oculta || undefined} className="flex shrink-0 items-center gap-6 pr-6">
      <Link href={`/explorar?categoria=${c.slug}`} tabIndex={oculta ? -1 : undefined}
        className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-white/90 hover:text-white md:text-5xl">
        <IconoCategoria nombre={c.icono} className="size-7 md:size-10" />
        <span className="serif">{c.nombre}</span>
      </Link>
      <span aria-hidden="true" className="size-3 rounded-full bg-acento" />
    </li>
  ));
  return (
    <section aria-labelledby="cinta-titulo" className="cinta bg-noche pb-4 pt-8 sobre-oscuro" data-pausada={pausada}>
      <h2 id="cinta-titulo" className="sr-only">Categorías</h2>
      <div className="overflow-hidden">
        <ul className="cinta-pista">{elementos(false)}{elementos(true)}</ul>
      </div>
      {/* En su propia fila: la pista es mas ancha que la pantalla y no debe quedar encima del boton. */}
      <div className="contenedor mt-4 flex justify-end">
      <button type="button" onClick={() => setPausada((v) => !v)} aria-pressed={pausada}
        className="boton size-11 shrink-0 bg-white/10 p-0 text-white hover:bg-white/20"
        aria-label={pausada ? 'Reanudar movimiento de las categorías' : 'Pausar movimiento de las categorías'}>
        {pausada ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
      </button>
      </div>
    </section>
  );
}
