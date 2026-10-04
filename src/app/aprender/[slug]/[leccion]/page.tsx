import { and, asc, desc, eq } from 'drizzle-orm';
import { ArrowLeft, ArrowRight, CircleCheck, CirclePlay, ClipboardCheck, FileText, MessagesSquare, PartyPopper } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { completarLeccionAccion } from '@/app/acciones/aprendizaje';
import { Evaluacion } from '@/components/aprender/Evaluacion';
import { LeerEnVoz } from '@/components/aprender/LeerEnVoz';
import { VideoLeccion } from '@/components/aprender/VideoLeccion';
import { BotonEnviar } from '@/components/formulario';
import { BarraProgreso } from '@/components/ui';
import { db, esquema as e } from '@/db';
import { normalizarPreferencias } from '@/lib/accesibilidad';
import { cursoPorSlug, inscripcion, leccionesCompletadas } from '@/lib/consultas';
import { markdownSeguro, textoPlano } from '@/lib/markdown';
import { recordarLeccion } from '@/lib/progreso';
import { usuarioActual } from '@/lib/sesion';

type Props = { params: Promise<{ slug: string; leccion: string }>; searchParams: Promise<{ terminado?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, leccion } = await params;
  const curso = await cursoPorSlug(slug);
  const l = curso?.modulos.flatMap((m) => m.lecciones).find((x) => x.id === Number(leccion));
  return { title: l && curso ? `${l.titulo} · ${curso.titulo}` : 'Lección' };
}

const ICONO = { lectura: FileText, video: CirclePlay, evaluacion: ClipboardCheck } as const;

export default async function Leccion({ params, searchParams }: Props) {
  const [{ slug, leccion }, { terminado }, usuario] = await Promise.all([params, searchParams, usuarioActual()]);
  const curso = await cursoPorSlug(slug);
  if (!curso) notFound();
  const todas = curso.modulos.flatMap((m) => m.lecciones);
  const indice = todas.findIndex((l) => l.id === Number(leccion));
  if (indice === -1) notFound();
  const meta = todas[indice];

  const mia = usuario ? await inscripcion(usuario.id, curso.id) : null;
  // Sin inscripcion solo se ven las lecciones de vista previa.
  if (!mia && !meta.vistaPrevia) redirect(usuario ? `/cursos/${slug}` : `/ingresar?siguiente=/aprender/${slug}/${leccion}`);

  const [completo, hechas] = await Promise.all([
    db.query.lecciones.findFirst({ where: eq(e.lecciones.id, meta.id), with: { preguntas: { orderBy: asc(e.preguntas.orden) } } }),
    usuario && mia ? leccionesCompletadas(usuario.id, curso.id) : Promise.resolve(new Set<number>()),
  ]);
  if (!completo) notFound();
  if (usuario && mia) await recordarLeccion(usuario.id, curso.id, meta.id);
  const mejor = usuario && meta.tipo === 'evaluacion'
    ? (await db.select({ p: e.intentos.puntaje }).from(e.intentos).where(and(eq(e.intentos.usuarioId, usuario.id), eq(e.intentos.leccionId, meta.id))).orderBy(desc(e.intentos.puntaje)).limit(1))[0]?.p ?? null
    : null;

  const anterior = todas[indice - 1];
  const siguiente = todas[indice + 1];
  const progreso = todas.length ? Math.round((hechas.size / todas.length) * 100) : 0;
  const velocidad = normalizarPreferencias(usuario?.accesibilidad).velocidadVoz;
  const cursoTerminado = !!mia?.completado;

  return (
    <div className="lg:grid lg:grid-cols-[20rem_1fr]">
      {/* Temario lateral */}
      <aside aria-labelledby="temario-titulo" className="border-b border-borde bg-superficie lg:sticky lg:top-[4.25rem] lg:h-[calc(100dvh-4.25rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="px-5 pt-4">
          <Link href={`/cursos/${slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-marca hover:underline">← {curso.titulo}</Link>
        </div>
        <details open className="group lg:[&>summary]:pointer-events-none">
          <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 pb-5 pt-1 lg:cursor-default">
            <span id="temario-titulo" className="text-lg font-bold">Contenido del curso <span className="text-sm font-normal text-tinta-2 lg:hidden">(mostrar u ocultar)</span></span>
            {mia && <><BarraProgreso valor={progreso} etiqueta="Progreso del curso" tono={progreso === 100 ? 'exito' : 'marca'} /><span className="text-sm text-tinta-2">{progreso}% completado</span></>}
          </summary>
          <nav aria-label="Lecciones del curso" className="pb-6">
            {curso.modulos.map((m) => (
              <div key={m.id}>
                <h2 className="px-5 pb-1 pt-4 text-xs font-bold uppercase tracking-widest text-tinta-3">{m.titulo}</h2>
                <ul>
                  {m.lecciones.map((l) => {
                    const Icono = hechas.has(l.id) ? CircleCheck : ICONO[l.tipo];
                    const actual = l.id === meta.id;
                    const accesible = !!mia || l.vistaPrevia;
                    return (
                      <li key={l.id}>
                        {accesible ? (
                          <Link href={`/aprender/${slug}/${l.id}`} aria-current={actual ? 'page' : undefined}
                            className={`flex min-h-12 items-start gap-3 border-l-4 px-4 py-2.5 text-[0.95rem] ${actual ? 'border-marca bg-marca-suave font-semibold' : 'border-transparent hover:bg-papel'}`}>
                            <Icono aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${hechas.has(l.id) ? 'text-exito' : 'text-tinta-3'}`} />
                            <span className="flex-1">{l.titulo}<span className="sr-only">{hechas.has(l.id) ? ', completada' : ''}</span></span>
                            <span className="text-xs text-tinta-2" aria-hidden="true">{l.duracionMin}′</span>
                          </Link>
                        ) : (
                          <span className="flex min-h-12 items-start gap-3 border-l-4 border-transparent px-4 py-2.5 text-[0.95rem] text-tinta-3">
                            <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0" />{l.titulo}<span className="sr-only"> (requiere inscripción)</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </details>
      </aside>

      {/* Leccion */}
      <article aria-labelledby="titulo-leccion" className="min-w-0 px-4 py-10 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-3xl">
          {terminado && cursoTerminado && (
            <div role="status" className="mb-8 rounded-2xl bg-noche p-7 text-white sobre-oscuro">
              <PartyPopper className="size-8 text-[#FFD166]" aria-hidden="true" />
              <p className="mt-3 text-2xl font-bold">¡Terminaste el curso!</p>
              <p className="mt-1 text-white/80">La IA ya lo tuvo en cuenta para tus próximas recomendaciones.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/" className="boton boton-claro">Ver mis recomendaciones</Link>
                <Link href={`/cursos/${slug}#resenas`} className="boton border border-white/30 text-white hover:bg-white/10">Dejar una reseña</Link>
              </div>
            </div>
          )}
          <p className="text-sm font-semibold uppercase tracking-widest text-tinta-2">
            Lección {indice + 1} de {todas.length} · {meta.tipo === 'evaluacion' ? 'Evaluación' : meta.tipo === 'video' ? 'Video' : 'Lectura'} · {meta.duracionMin} min
          </p>
          <h1 id="titulo-leccion" className="mt-2 text-[clamp(2rem,4vw,2.9rem)] font-bold leading-tight tracking-[-0.03em]">{meta.titulo}</h1>

          {!mia && <p className="mt-4 rounded-xl bg-marca-suave px-4 py-3">Estás viendo una lección de vista previa. <Link href={`/cursos/${slug}`} className="font-semibold text-marca underline">Inscríbete gratis</Link> para acceder a todo el curso.</p>}

          <div className="mt-8">
            {meta.tipo === 'evaluacion' ? (
              <>
                <div className="prosa mb-8" dangerouslySetInnerHTML={{ __html: markdownSeguro(completo.contenido) }} />
                {mia ? (
                  <Evaluacion leccionId={meta.id} mejorNota={mejor}
                    preguntas={completo.preguntas.map((p) => ({ id: p.id, enunciado: p.enunciado, opciones: p.opciones.map((o) => o.texto) }))} />
                ) : <p className="text-tinta-2">Inscríbete para presentar la evaluación.</p>}
              </>
            ) : meta.tipo === 'video' ? (
              <>
                <VideoLeccion titulo={meta.titulo} url={completo.videoUrl} transcripcionHtml={completo.transcripcion ? markdownSeguro(completo.transcripcion) : ''} />
                {completo.contenido && <div className="prosa mt-8" dangerouslySetInnerHTML={{ __html: markdownSeguro(completo.contenido) }} />}
              </>
            ) : (
              <>
                <LeerEnVoz texto={`${meta.titulo}. ${textoPlano(completo.contenido)}`} velocidad={velocidad} />
                <div className="prosa mt-8" dangerouslySetInnerHTML={{ __html: markdownSeguro(completo.contenido) }} />
              </>
            )}
          </div>

          {/* Navegacion entre lecciones */}
          <nav aria-label="Navegación entre lecciones" className="mt-14 flex flex-col gap-4 border-t border-borde pt-8 sm:flex-row sm:items-center sm:justify-between">
            {anterior && (mia || anterior.vistaPrevia)
              ? <Link href={`/aprender/${slug}/${anterior.id}`} className="boton boton-secundario"><ArrowLeft className="size-4" aria-hidden="true" />Anterior<span className="sr-only">: {anterior.titulo}</span></Link>
              : <span />}
            {mia && meta.tipo !== 'evaluacion' && (
              <form action={completarLeccionAccion}>
                <input type="hidden" name="leccionId" value={meta.id} />
                {siguiente && <input type="hidden" name="siguienteId" value={siguiente.id} />}
                <BotonEnviar className="boton boton-primario h-12 px-6" pendiente="Guardando…">
                  {hechas.has(meta.id) ? 'Siguiente lección' : siguiente ? 'Completar y continuar' : 'Completar lección'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </BotonEnviar>
              </form>
            )}
            {mia && meta.tipo === 'evaluacion' && siguiente && (
              <Link href={`/aprender/${slug}/${siguiente.id}`} className="boton boton-secundario">Siguiente<ArrowRight className="size-4" aria-hidden="true" /></Link>
            )}
          </nav>

          {mia && (
            <p className="mt-8 flex items-center gap-2 text-tinta-2">
              <MessagesSquare className="size-5" aria-hidden="true" />¿Tienes dudas? <Link href={`/cursos/${slug}/foro?leccion=${meta.id}`} className="font-semibold text-marca underline underline-offset-4">Pregunta en el foro</Link>
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
