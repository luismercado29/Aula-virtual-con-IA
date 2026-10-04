import { asc, eq } from 'drizzle-orm';
import { CircleCheck, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { actualizarLeccionAccion, agregarPreguntaAccion, eliminarLeccionAccion, eliminarPreguntaAccion } from '@/app/acciones/docencia';
import { BotonEnviar } from '@/components/formulario';
import { db, esquema as e } from '@/db';
import { requerirRol } from '@/lib/sesion';

import { Mensajes } from '../../../../Mensajes';

export const metadata: Metadata = { title: 'Editar lección' };

export default async function EditorLeccion({ params, searchParams }: { params: Promise<{ id: string; lid: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const usuario = await requerirRol(['profesor', 'admin'], '/docencia');
  const [{ id, lid }, msg] = await Promise.all([params, searchParams]);
  const curso = await db.query.cursos.findFirst({ where: eq(e.cursos.id, Number(id)), columns: { id: true, titulo: true, profesorId: true } });
  if (!curso || (curso.profesorId !== usuario.id && usuario.rol !== 'admin')) notFound();
  const leccion = await db.query.lecciones.findFirst({ where: eq(e.lecciones.id, Number(lid)), with: { modulo: true, preguntas: { orderBy: asc(e.preguntas.orden) } } });
  if (!leccion || leccion.modulo.cursoId !== curso.id) notFound();
  const etiqueta = (id: string, t: string) => <label htmlFor={id} className="block font-semibold">{t}</label>;

  return (
    <div className="contenedor max-w-4xl py-10">
      <Link href={`/docencia/cursos/${curso.id}#contenido`} className="text-sm font-semibold text-marca hover:underline">← {curso.titulo}</Link>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Editar lección</h1>
      <p className="mt-1 text-tinta-2">Módulo: {leccion.modulo.titulo} · Tipo: {leccion.tipo === 'evaluacion' ? 'Evaluación' : leccion.tipo === 'video' ? 'Video' : 'Lectura'}</p>
      <div className="mt-6"><Mensajes ok={msg.ok} error={msg.error} /></div>

      <form action={actualizarLeccionAccion} className="tarjeta mt-6 space-y-5 p-6">
        <input type="hidden" name="leccionId" value={leccion.id} />
        <div className="space-y-1.5">{etiqueta('l-titulo', 'Título')}<input id="l-titulo" name="titulo" defaultValue={leccion.titulo} required minLength={3} maxLength={140} className="campo" /></div>
        {leccion.tipo === 'video' && (
          <>
            <div className="space-y-1.5">{etiqueta('l-video', 'Enlace del video')}
              <input id="l-video" name="videoUrl" type="url" defaultValue={leccion.videoUrl ?? ''} className="campo" aria-describedby="l-video-ayuda" placeholder="https://www.youtube.com/watch?v=…" />
              <p id="l-video-ayuda" className="text-sm text-tinta-2">YouTube, Vimeo o un archivo MP4 por HTTPS. Activa los subtítulos en la plataforma de origen.</p></div>
            <div className="space-y-1.5">{etiqueta('l-trans', 'Transcripción (obligatoria para publicar)')}
              <textarea id="l-trans" name="transcripcion" defaultValue={leccion.transcripcion} rows={8} className="campo" aria-describedby="l-trans-ayuda" />
              <p id="l-trans-ayuda" className="text-sm text-tinta-2">Todo lo que se dice y lo que se muestra de forma relevante. Permite seguir la clase a personas sordas, ciegas o sordociegas.</p></div>
          </>
        )}
        <div className="space-y-1.5">{etiqueta('l-cont', leccion.tipo === 'evaluacion' ? 'Instrucciones' : leccion.tipo === 'video' ? 'Notas adicionales (opcional)' : 'Contenido')}
          <textarea id="l-cont" name="contenido" defaultValue={leccion.contenido} rows={leccion.tipo === 'lectura' ? 16 : 4} className="campo font-mono text-[0.95rem]" aria-describedby="l-cont-ayuda" />
          <p id="l-cont-ayuda" className="text-sm text-tinta-2">Markdown: usa «## Título» para secciones (no «#»), listas con guiones y **negrita**. Los estudiantes pueden escucharlo en voz alta.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">{etiqueta('l-dur', 'Duración estimada (minutos)')}<input id="l-dur" name="duracionMin" type="number" min={1} max={600} defaultValue={leccion.duracionMin} className="campo" /></div>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 self-end"><input type="checkbox" name="vistaPrevia" defaultChecked={leccion.vistaPrevia} className="size-5 accent-marca" /><span className="font-semibold">Vista previa gratuita</span></label>
        </div>
        <BotonEnviar pendiente="Guardando…">Guardar lección</BotonEnviar>
      </form>

      {leccion.tipo === 'evaluacion' && (
        <section id="preguntas" aria-labelledby="preguntas-titulo" className="mt-10 scroll-mt-24">
          <h2 id="preguntas-titulo" className="text-2xl font-bold">Preguntas ({leccion.preguntas.length})</h2>
          <ol className="mt-5 space-y-4">
            {leccion.preguntas.map((p, i) => (
              <li key={p.id} className="tarjeta p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">{i + 1}. {p.enunciado}</p>
                  <form action={eliminarPreguntaAccion}><input type="hidden" name="preguntaId" value={p.id} />
                    <button type="submit" className="boton boton-fantasma px-3 text-error" aria-label={`Eliminar la pregunta ${i + 1}`}><Trash2 className="size-4" aria-hidden="true" /></button></form>
                </div>
                <ul className="mt-3 space-y-1">{p.opciones.map((o, j) => (
                  <li key={j} className={`flex items-center gap-2 ${o.correcta ? 'font-semibold text-exito' : ''}`}>{o.correcta ? <CircleCheck className="size-4" aria-hidden="true" /> : <span className="w-4" />}{o.texto}{o.correcta && <span className="sr-only"> (correcta)</span>}</li>
                ))}</ul>
              </li>
            ))}
          </ol>
          <form action={agregarPreguntaAccion} className="tarjeta mt-6 space-y-4 p-6">
            <h3 className="text-xl font-bold">Agregar pregunta</h3>
            <input type="hidden" name="leccionId" value={leccion.id} />
            <div className="space-y-1.5">{etiqueta('p-enun', 'Enunciado')}<input id="p-enun" name="enunciado" required minLength={5} className="campo" /></div>
            <div className="space-y-1.5">{etiqueta('p-ops', 'Opciones (una por línea)')}<textarea id="p-ops" name="opciones" rows={4} required className="campo" /></div>
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div className="space-y-1.5">{etiqueta('p-ok', 'Número de la correcta')}<input id="p-ok" name="correcta" type="number" min={1} max={6} required className="campo" /></div>
              <div className="space-y-1.5">{etiqueta('p-exp', 'Explicación (se muestra al corregir)')}<input id="p-exp" name="explicacion" className="campo" /></div>
            </div>
            <BotonEnviar pendiente="Agregando…">Agregar pregunta</BotonEnviar>
          </form>
        </section>
      )}

      <form action={eliminarLeccionAccion} className="mt-12 border-t border-borde pt-6">
        <input type="hidden" name="leccionId" value={leccion.id} />
        <button type="submit" className="boton bg-error-suave text-error hover:bg-error hover:text-white"><Trash2 className="size-4" aria-hidden="true" />Eliminar esta lección</button>
      </form>
    </div>
  );
}
