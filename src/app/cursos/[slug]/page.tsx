import { Award, BookOpen, Check, ChevronDown, CirclePlay, ClipboardCheck, Clock, FileText, Globe, Lock, MessagesSquare, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { inscribirseAccion } from '@/app/acciones/aprendizaje';
import { FilaCursos } from '@/components/FilaCursos';
import { BotonEnviar } from '@/components/formulario';
import { PortadaCurso } from '@/components/PortadaCurso';
import { duracionTexto, Estrellas, NIVEL_TEXTO } from '@/components/ui';
import { cursoPorSlug, inscripcion, resenasDeCurso } from '@/lib/consultas';
import { registrarEvento } from '@/lib/eventos';
import { markdownSeguro } from '@/lib/markdown';
import { tambienVieron } from '@/lib/recomendador/servicio';
import { usuarioActual } from '@/lib/sesion';

import { FormularioResena } from './FormularioResena';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ origen?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const curso = await cursoPorSlug((await params).slug);
  return curso ? { title: curso.titulo, description: curso.subtitulo } : { title: 'Curso no encontrado' };
}

const ICONO_TIPO = { lectura: FileText, video: CirclePlay, evaluacion: ClipboardCheck } as const;
const TEXTO_TIPO = { lectura: 'Lectura', video: 'Video', evaluacion: 'Evaluación' } as const;

export default async function PaginaCurso({ params, searchParams }: Props) {
  const [{ slug }, { origen }, usuario] = await Promise.all([params, searchParams, usuarioActual()]);
  const curso = await cursoPorSlug(slug);
  const esAutor = usuario && (usuario.id === curso?.profesorId || usuario.rol === 'admin');
  if (!curso || (curso.estado !== 'publicado' && !esAutor)) notFound();

  const [mia, { resenas, distribucion }, similares] = await Promise.all([
    usuario ? inscripcion(usuario.id, curso.id) : null,
    resenasDeCurso(curso.id),
    tambienVieron(curso.id, usuario?.id ?? null),
  ]);
  if (usuario) await registrarEvento(usuario.id, origen === 'recomendacion' ? 'clic_recomendacion' : 'vista_curso', { cursoId: curso.id });

  const lecciones = curso.modulos.flatMap((m) => m.lecciones);
  const miResena = usuario ? resenas.find((r) => r.usuarioId === usuario.id) : undefined;

  return (
    <>
      {/* Encabezado oscuro estilo plataforma de cursos */}
      <section className="bg-noche text-white sobre-oscuro">
        <div className="contenedor grid gap-10 py-12 lg:grid-cols-[1fr_22rem] lg:py-16">
          <div>
            <nav aria-label="Ruta de navegación" className="text-sm">
              <ol className="flex flex-wrap items-center gap-2 text-white/75">
                <li><Link href="/explorar" className="hover:text-white hover:underline">Cursos</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href={`/explorar?categoria=${curso.categoria.slug}`} className="hover:text-white hover:underline">{curso.categoria.nombre}</Link></li>
              </ol>
            </nav>
            <h1 className="mt-4 text-[clamp(2.2rem,4.5vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.03em]">{curso.titulo}</h1>
            <p className="mt-4 max-w-2xl text-xl text-white/85">{curso.subtitulo}</p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-white/85">
              <li className="[&_.text-estrella]:text-[#FFC94D] [&_.text-estrella-texto]:text-[#FFC94D] [&_.fill-estrella]:fill-[#FFC94D] [&_.text-tinta-2]:text-white/75 [&_.text-borde-fuerte]:text-white/30"><Estrellas valor={curso.promedio} total={curso.nResenas} /></li>
              <li className="flex items-center gap-2"><Users className="size-5" aria-hidden="true" />{curso.inscritos.toLocaleString('es-CO')} estudiantes</li>
              <li className="flex items-center gap-2"><Award className="size-5" aria-hidden="true" />{NIVEL_TEXTO[curso.nivel]}</li>
              <li className="flex items-center gap-2"><Globe className="size-5" aria-hidden="true" />Español</li>
            </ul>
            <p className="mt-5 text-white/80">Creado por <a href="#profesor" className="font-semibold text-white underline underline-offset-4">{curso.profesor.nombre}</a></p>
            {curso.estado !== 'publicado' && <p className="mt-4 inline-block rounded-lg bg-[#FFD166] px-3 py-1 font-semibold text-noche">Borrador: solo tú puedes verlo</p>}
          </div>

          <aside aria-label="Inscripción" className="lg:row-span-2">
            <div className="overflow-hidden rounded-2xl bg-superficie text-tinta shadow-elevada lg:sticky lg:top-24">
              <div className="aspect-video">
                <PortadaCurso titulo={curso.titulo} color={curso.categoria.color} icono={curso.categoria.icono} categoria={curso.categoria.nombre} grande />
              </div>
              <div className="space-y-4 p-6">
                <p className="text-3xl font-bold">Gratis</p>
                {mia ? (
                  <Link href={`/aprender/${curso.slug}`} className="boton boton-primario h-12 w-full">
                    {mia.completado ? 'Repasar el curso' : 'Continuar aprendiendo'}
                  </Link>
                ) : usuario ? (
                  <form action={inscribirseAccion}>
                    <input type="hidden" name="cursoId" value={curso.id} />
                    <BotonEnviar className="boton boton-primario h-12 w-full" pendiente="Inscribiendo…">Inscribirme</BotonEnviar>
                  </form>
                ) : (
                  <Link href={`/ingresar?siguiente=/cursos/${curso.slug}`} className="boton boton-primario h-12 w-full">Ingresa para inscribirte</Link>
                )}
                <ul className="space-y-2 text-tinta-2">
                  <li className="flex items-center gap-3"><Clock className="size-5" aria-hidden="true" />{duracionTexto(curso.duracionMin)} de contenido</li>
                  <li className="flex items-center gap-3"><BookOpen className="size-5" aria-hidden="true" />{curso.nLecciones} lecciones</li>
                  <li className="flex items-center gap-3"><MessagesSquare className="size-5" aria-hidden="true" />Foro con el profesor</li>
                  <li className="flex items-center gap-3"><Award className="size-5" aria-hidden="true" />Constancia al completar</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="contenedor grid gap-12 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-12">
          {curso.aprenderas.length > 0 && (
            <section aria-labelledby="aprenderas" className="tarjeta p-7">
              <h2 id="aprenderas" className="text-2xl font-bold">Lo que aprenderás</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {curso.aprenderas.map((a) => <li key={a} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-exito" aria-hidden="true" />{a}</li>)}
              </ul>
            </section>
          )}

          <section aria-labelledby="temario">
            <h2 id="temario" className="text-2xl font-bold">Contenido del curso</h2>
            <p className="mt-1 text-tinta-2">{curso.modulos.length} módulos · {lecciones.length} lecciones · {duracionTexto(curso.duracionMin)}</p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-borde bg-superficie">
              {curso.modulos.map((m, i) => (
                <details key={m.id} open={i === 0} className="group border-b border-borde last:border-0">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 bg-papel px-5 py-3 font-bold hover:bg-marca-suave">
                    <span>{m.titulo}</span>
                    <span className="flex items-center gap-3 text-sm font-normal text-tinta-2">
                      {m.lecciones.length} lecciones
                      <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </span>
                  </summary>
                  <ul>
                    {m.lecciones.map((l) => {
                      const Icono = ICONO_TIPO[l.tipo];
                      return (
                        <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                          <Icono className="size-5 shrink-0 text-tinta-3" aria-hidden="true" />
                          <span className="flex-1">
                            {l.vistaPrevia || mia ? <Link href={`/aprender/${curso.slug}/${l.id}`} className="underline-offset-4 hover:underline">{l.titulo}</Link> : l.titulo}
                            <span className="sr-only"> ({TEXTO_TIPO[l.tipo]}, {l.duracionMin} minutos)</span>
                          </span>
                          {l.vistaPrevia && !mia && <span className="etiqueta-chip">Vista previa</span>}
                          {!l.vistaPrevia && !mia && <Lock className="size-4 text-tinta-3" aria-label="Requiere inscripción" />}
                          <span className="text-sm text-tinta-2" aria-hidden="true">{l.duracionMin} min</span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {curso.requisitos.length > 0 && (
            <section aria-labelledby="requisitos">
              <h2 id="requisitos" className="text-2xl font-bold">Requisitos</h2>
              <ul className="mt-4 list-disc space-y-1 pl-6">{curso.requisitos.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}

          <section aria-labelledby="descripcion">
            <h2 id="descripcion" className="text-2xl font-bold">Descripción</h2>
            <div className="prosa mt-4" dangerouslySetInnerHTML={{ __html: markdownSeguro(curso.descripcion) }} />
            {curso.etiquetas.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Temas">
                {curso.etiquetas.map((t) => <li key={t}><Link href={`/explorar?q=${encodeURIComponent(t)}`} className="etiqueta-chip hover:bg-marca hover:text-white">{t}</Link></li>)}
              </ul>
            )}
          </section>

          <section id="profesor" aria-labelledby="profesor-titulo" className="scroll-mt-28">
            <h2 id="profesor-titulo" className="text-2xl font-bold">Tu profesor</h2>
            <div className="mt-4 flex gap-5">
              <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-marca text-2xl font-bold text-white">
                {curso.profesor.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
              <div>
                <p className="text-xl font-bold">{curso.profesor.nombre}</p>
                {curso.profesor.titular && <p className="text-tinta-2">{curso.profesor.titular}</p>}
                {curso.profesor.bio && <p className="mt-3 max-w-2xl">{curso.profesor.bio}</p>}
              </div>
            </div>
          </section>

          <section aria-labelledby="resenas">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="resenas" className="text-2xl font-bold">Reseñas de estudiantes</h2>
              <Link href={`/cursos/${curso.slug}/foro`} className="boton boton-secundario"><MessagesSquare className="size-5" aria-hidden="true" />Ir al foro del curso</Link>
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-[14rem_1fr]">
              <div>
                <p className="text-6xl font-bold text-estrella-texto">{curso.promedio?.toFixed(1).replace('.', ',') ?? '—'}</p>
                <Estrellas valor={curso.promedio} tamano="md" />
                <p className="mt-1 text-tinta-2">{curso.nResenas} reseñas</p>
                <ul className="mt-4 space-y-1.5" aria-label="Distribución de calificaciones">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const n = distribucion.get(s) ?? 0;
                    const pct = curso.nResenas ? Math.round((n / curso.nResenas) * 100) : 0;
                    return (
                      <li key={s} className="flex items-center gap-2 text-sm">
                        <span className="w-16 shrink-0">{s} estrella{s > 1 ? 's' : ''}</span>
                        <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-borde"><span className="block h-full bg-estrella" style={{ width: `${pct}%` }} /></span>
                        <span className="w-10 text-right text-tinta-2">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="space-y-6">
                {mia && <FormularioResena cursoId={curso.id} actual={miResena ? { calificacion: miResena.calificacion, comentario: miResena.comentario } : undefined} />}
                {resenas.length ? (
                  <ul className="divide-y divide-borde">
                    {resenas.map((r) => (
                      <li key={r.usuarioId} className="py-5">
                        <div className="flex items-center gap-3">
                          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-tinta text-sm font-bold text-white">{r.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                          <div>
                            <p className="font-semibold">{r.nombre}</p>
                            <Estrellas valor={r.calificacion} />
                          </div>
                          <time dateTime={r.creado.toISOString()} className="ml-auto text-sm text-tinta-2">{r.creado.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                        </div>
                        {r.comentario && <p className="mt-3">{r.comentario}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-tinta-2">Aún no hay reseñas. ¡Sé quien deje la primera!</p>}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="contenedor pb-16">
        <FilaCursos id="tambien" titulo="Estudiantes que tomaron este curso también vieron" cursos={similares} />
      </div>
    </>
  );
}
