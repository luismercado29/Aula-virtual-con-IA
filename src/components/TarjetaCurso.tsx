import { Clock, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

import type { TarjetaCurso as Datos } from '@/lib/consultas';

import { NoMeInteresa } from './NoMeInteresa';
import { PortadaCurso } from './PortadaCurso';
import { BarraProgreso, duracionTexto, Estrellas, NIVEL_TEXTO } from './ui';

/**
 * Tarjeta de curso. Todo el bloque es clicable, pero el enlace real es el
 * titulo (un solo punto de tabulacion y un nombre claro para el lector).
 */
export function TarjetaCurso({ curso, razon, desdeRecomendacion = false, progreso, encabezado = 'h3' }: {
  curso: Datos; razon?: string; desdeRecomendacion?: boolean; progreso?: number; encabezado?: 'h2' | 'h3';
}) {
  const Titulo = encabezado;
  const href = progreso != null ? `/aprender/${curso.slug}` : `/cursos/${curso.slug}${desdeRecomendacion ? '?origen=recomendacion' : ''}`;
  return (
    <article className="tarjeta group relative flex h-full flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-[var(--ease-salida)] hover:-translate-y-1 hover:shadow-elevada">
      <div className="aspect-[16/10]">
        <PortadaCurso titulo={curso.titulo} color={curso.categoria.color} icono={curso.categoria.icono} categoria={curso.categoria.nombre} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {razon && (
          <p className="flex items-start gap-1.5 text-sm font-semibold text-marca">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span><span className="sr-only">Recomendado: </span>{razon}</span>
          </p>
        )}
        <Titulo className="text-lg font-bold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:ring-0">
            {curso.titulo}
          </Link>
        </Titulo>
        <p className="text-sm text-tinta-2">{curso.profesor}</p>
        {progreso != null ? (
          <div className="mt-auto pt-2">
            <BarraProgreso valor={progreso} etiqueta={`Progreso en ${curso.titulo}`} tono={progreso === 100 ? 'exito' : 'marca'} />
            <p className="mt-2 text-sm font-semibold">{progreso === 100 ? 'Completado' : `${progreso}% completado`}</p>
          </div>
        ) : (
          <>
            <Estrellas valor={curso.promedio} total={curso.nResenas} />
            <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-tinta-2">
              <li className="flex items-center gap-1"><Clock className="size-4" aria-hidden="true" />{duracionTexto(curso.duracionMin)}</li>
              <li className="flex items-center gap-1"><Users className="size-4" aria-hidden="true" />{curso.inscritos.toLocaleString('es-CO')}<span className="sr-only"> estudiantes</span></li>
              <li>{NIVEL_TEXTO[curso.nivel]}</li>
            </ul>
          </>
        )}
      </div>
      {desdeRecomendacion && <NoMeInteresa cursoId={curso.id} titulo={curso.titulo} />}
      {/* Anillo de foco de toda la tarjeta cuando se tabula al titulo. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-marca ring-offset-2 group-has-[a:focus-visible]:ring-[3px]" />
    </article>
  );
}
