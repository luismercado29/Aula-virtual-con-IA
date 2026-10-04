import { asc, eq } from 'drizzle-orm';
import { CircleAlert, CircleCheck, CirclePlay, ClipboardCheck, Eye, FileText, Plus, Trash2, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { actualizarCursoAccion, agregarLeccionAccion, agregarModuloAccion, cambiarEstadoAccion, eliminarModuloAccion } from '@/app/acciones/docencia';
import { BotonEnviar } from '@/components/formulario';
import { db, esquema as e } from '@/db';
import { categoriasConConteo } from '@/lib/consultas';
import { problemasParaPublicar } from '@/lib/docencia';
import { requerirRol } from '@/lib/sesion';

import { Mensajes } from '../../Mensajes';

export const metadata: Metadata = { title: 'Editar curso' };
const ICONO = { lectura: FileText, video: CirclePlay, evaluacion: ClipboardCheck } as const;

export default async function EditorCurso({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const usuario = await requerirRol(['profesor', 'admin'], '/docencia');
  const [{ id }, msg] = await Promise.all([params, searchParams]);
  const curso = await db.query.cursos.findFirst({
    where: eq(e.cursos.id, Number(id)),
    with: { categoria: true, modulos: { orderBy: asc(e.modulos.orden), with: { lecciones: { orderBy: asc(e.lecciones.orden), columns: { id: true, titulo: true, tipo: true, duracionMin: true } } } } },
  });
  if (!curso || (curso.profesorId !== usuario.id && usuario.rol !== 'admin')) notFound();
  const [categorias, problemas] = await Promise.all([categoriasConConteo(), problemasParaPublicar(curso.id)]);
  const campo = (id: string, etiqueta: string, hijo: React.ReactNode, ayuda?: string) => (
    <div className="space-y-1.5"><label htmlFor={id} className="block font-semibold">{etiqueta}</label>{hijo}{ayuda && <p id={`${id}-ayuda`} className="text-sm text-tinta-2">{ayuda}</p>}</div>
  );

  return (
    <div className="contenedor py-10">
      <Link href="/docencia" className="text-sm font-semibold text-marca hover:underline">← Panel de docencia</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{curso.titulo}</h1>
          <p className={`mt-1 font-semibold ${curso.estado === 'publicado' ? 'text-exito' : 'text-aviso'}`}>{curso.estado === 'publicado' ? 'Publicado' : 'Borrador'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/cursos/${curso.slug}`} className="boton boton-secundario"><Eye className="size-5" aria-hidden="true" />Ver como estudiante</Link>
          <Link href={`/docencia/cursos/${curso.id}/estudiantes`} className="boton boton-secundario"><Users className="size-5" aria-hidden="true" />Calificaciones</Link>
        </div>
      </div>
      <div className="mt-6"><Mensajes ok={msg.ok} error={msg.error} /></div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <form action={actualizarCursoAccion} className="tarjeta space-y-5 p-6" aria-labelledby="info-titulo">
            <h2 id="info-titulo" className="text-2xl font-bold">Información</h2>
            <input type="hidden" name="cursoId" value={curso.id} />
            {campo('c-titulo', 'Título', <input id="c-titulo" name="titulo" defaultValue={curso.titulo} required minLength={5} maxLength={120} className="campo" />)}
            {campo('c-sub', 'Subtítulo', <input id="c-sub" name="subtitulo" defaultValue={curso.subtitulo} maxLength={200} className="campo" />)}
            <div className="grid gap-5 sm:grid-cols-2">
              {campo('c-cat', 'Categoría', <select id="c-cat" name="categoria" defaultValue={curso.categoria.slug} className="campo">{categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}</select>)}
              {campo('c-nivel', 'Nivel', <select id="c-nivel" name="nivel" defaultValue={curso.nivel} className="campo"><option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option></select>)}
            </div>
            {campo('c-desc', 'Descripción', <textarea id="c-desc" name="descripcion" defaultValue={curso.descripcion} rows={6} className="campo" aria-describedby="c-desc-ayuda" />, 'Admite Markdown: **negrita**, listas con guiones y enlaces.')}
            {campo('c-tags', 'Temas', <input id="c-tags" name="etiquetas" defaultValue={curso.etiquetas.join(', ')} className="campo" aria-describedby="c-tags-ayuda" />, 'Separados por comas. La IA los usa para recomendar el curso a quien le interesen.')}
            {campo('c-apr', 'Lo que aprenderán', <textarea id="c-apr" name="aprenderas" defaultValue={curso.aprenderas.join('\n')} rows={4} className="campo" aria-describedby="c-apr-ayuda" />, 'Un resultado por línea.')}
            {campo('c-req', 'Requisitos', <textarea id="c-req" name="requisitos" defaultValue={curso.requisitos.join('\n')} rows={3} className="campo" aria-describedby="c-req-ayuda" />, 'Uno por línea.')}
            <BotonEnviar pendiente="Guardando…">Guardar información</BotonEnviar>
          </form>

          <section id="contenido" aria-labelledby="contenido-titulo" className="scroll-mt-24">
            <h2 id="contenido-titulo" className="text-2xl font-bold">Contenido</h2>
            <div className="mt-5 space-y-5">
              {curso.modulos.map((m) => (
                <div key={m.id} className="tarjeta overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-borde bg-papel px-5 py-3">
                    <h3 className="font-bold">{m.orden}. {m.titulo}</h3>
                    <form action={eliminarModuloAccion}>
                      <input type="hidden" name="moduloId" value={m.id} />
                      <button type="submit" className="boton boton-fantasma px-3 text-error" aria-label={`Eliminar el módulo ${m.titulo} y sus lecciones`}><Trash2 className="size-4" aria-hidden="true" /></button>
                    </form>
                  </div>
                  <ul className="divide-y divide-borde">
                    {m.lecciones.map((l) => {
                      const Icono = ICONO[l.tipo];
                      return (
                        <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                          <Icono className="size-5 text-tinta-3" aria-hidden="true" />
                          <Link href={`/docencia/cursos/${curso.id}/lecciones/${l.id}`} className="flex-1 font-medium hover:underline">{l.titulo}</Link>
                          <span className="text-sm text-tinta-2">{l.duracionMin} min</span>
                        </li>
                      );
                    })}
                  </ul>
                  <form action={agregarLeccionAccion} className="flex flex-wrap items-end gap-3 border-t border-borde p-4">
                    <input type="hidden" name="moduloId" value={m.id} />
                    <div className="min-w-48 flex-1 space-y-1"><label htmlFor={`l-${m.id}`} className="text-sm font-semibold">Nueva lección</label><input id={`l-${m.id}`} name="titulo" required minLength={3} className="campo min-h-11" placeholder="Título de la lección" /></div>
                    <div className="space-y-1"><label htmlFor={`t-${m.id}`} className="text-sm font-semibold">Tipo</label>
                      <select id={`t-${m.id}`} name="tipo" className="campo min-h-11"><option value="lectura">Lectura</option><option value="video">Video</option><option value="evaluacion">Evaluación</option></select></div>
                    <button type="submit" className="boton boton-secundario"><Plus className="size-4" aria-hidden="true" />Agregar<span className="sr-only"> lección a {m.titulo}</span></button>
                  </form>
                </div>
              ))}
              <form action={agregarModuloAccion} className="flex flex-wrap items-end gap-3 rounded-2xl border-2 border-dashed border-borde-fuerte p-5">
                <input type="hidden" name="cursoId" value={curso.id} />
                <div className="min-w-48 flex-1 space-y-1"><label htmlFor="nuevo-modulo" className="font-semibold">Nuevo módulo</label><input id="nuevo-modulo" name="titulo" required minLength={3} className="campo" /></div>
                <button type="submit" className="boton boton-primario"><Plus className="size-4" aria-hidden="true" />Agregar módulo</button>
              </form>
            </div>
          </section>
        </div>

        <aside aria-labelledby="publicacion">
          <div className="tarjeta space-y-4 p-6 lg:sticky lg:top-24">
            <h2 id="publicacion" className="text-xl font-bold">Publicación</h2>
            {problemas.length ? (
              <>
                <p className="text-tinta-2">Antes de publicar:</p>
                <ul className="space-y-2">{problemas.map((p) => <li key={p} className="flex gap-2 text-sm"><CircleAlert className="mt-0.5 size-4 shrink-0 text-aviso" aria-hidden="true" />{p}</li>)}</ul>
              </>
            ) : <p className="flex gap-2 text-exito"><CircleCheck className="size-5 shrink-0" aria-hidden="true" />Todo listo, incluidas las verificaciones de accesibilidad.</p>}
            <form action={cambiarEstadoAccion}>
              <input type="hidden" name="cursoId" value={curso.id} />
              {curso.estado === 'borrador'
                ? <BotonEnviar className="boton boton-primario w-full" pendiente="Publicando…">Publicar curso</BotonEnviar>
                : <BotonEnviar className="boton boton-secundario w-full" pendiente="Guardando…">Volver a borrador</BotonEnviar>}
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
