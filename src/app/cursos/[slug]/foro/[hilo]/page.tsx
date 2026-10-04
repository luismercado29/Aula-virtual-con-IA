import { asc, eq } from 'drizzle-orm';
import { CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { alternarResueltoAccion } from '@/app/acciones/foro';
import { db, esquema as e } from '@/db';
import { cursoPorSlug, inscripcion } from '@/lib/consultas';
import { usuarioActual } from '@/lib/sesion';

import { Responder } from '../FormulariosForo';

export const metadata: Metadata = { title: 'Conversación del foro' };

function Mensaje({ autor, fecha, cuerpo, esProfesor }: { autor: string; fecha: Date; cuerpo: string; esProfesor: boolean }) {
  return (
    <article className={`rounded-2xl border p-5 ${esProfesor ? 'border-marca/40 bg-marca-suave' : 'border-borde bg-superficie'}`}>
      <header className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-tinta text-sm font-bold text-white">{autor.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
        <h3 className="font-bold">{autor}</h3>
        {esProfesor && <span className="etiqueta-chip bg-marca text-white">Profesor</span>}
        <time dateTime={fecha.toISOString()} className="ml-auto text-sm text-tinta-2">{fecha.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</time>
      </header>
      {/* Texto plano: el foro no admite HTML (whitespace-pre-line conserva los saltos de linea). */}
      <p className="mt-3 whitespace-pre-line">{cuerpo}</p>
    </article>
  );
}

export default async function Hilo({ params }: { params: Promise<{ slug: string; hilo: string }> }) {
  const [{ slug, hilo: idHilo }, usuario] = await Promise.all([params, usuarioActual()]);
  const curso = await cursoPorSlug(slug);
  if (!curso) notFound();
  const hilo = await db.query.hilos.findFirst({
    where: eq(e.hilos.id, Number(idHilo)),
    with: { autor: { columns: { nombre: true } }, respuestas: { orderBy: asc(e.respuestas.creado), with: { autor: { columns: { nombre: true } } } } },
  });
  if (!hilo || hilo.cursoId !== curso.id) notFound();
  const participa = usuario && (usuario.rol === 'admin' || usuario.id === curso.profesorId || !!(await inscripcion(usuario.id, curso.id)));
  const puedeResolver = usuario && (usuario.id === hilo.usuarioId || usuario.id === curso.profesorId || usuario.rol === 'admin');

  return (
    <div className="contenedor max-w-3xl py-10">
      <Link href={`/cursos/${slug}/foro`} className="text-sm font-semibold text-marca hover:underline">← Foro de {curso.titulo}</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{hilo.titulo}</h1>
        {hilo.resuelto && <p className="flex items-center gap-1 font-semibold text-exito"><CircleCheck className="size-5" aria-hidden="true" />Resuelta</p>}
      </div>
      <div className="mt-6 space-y-4">
        <Mensaje autor={hilo.autor.nombre} fecha={hilo.creado} cuerpo={hilo.cuerpo} esProfesor={hilo.usuarioId === curso.profesorId} />
        <h2 className="pt-4 text-xl font-bold">{hilo.respuestas.length} respuesta{hilo.respuestas.length === 1 ? '' : 's'}</h2>
        <ol className="space-y-4">
          {hilo.respuestas.map((r) => (
            <li key={r.id}><Mensaje autor={r.autor.nombre} fecha={r.creado} cuerpo={r.cuerpo} esProfesor={r.usuarioId === curso.profesorId} /></li>
          ))}
        </ol>
        {puedeResolver && (
          <form action={alternarResueltoAccion}>
            <input type="hidden" name="hiloId" value={hilo.id} />
            <button type="submit" className="boton boton-secundario"><CircleCheck className="size-5" aria-hidden="true" />{hilo.resuelto ? 'Marcar como no resuelta' : 'Marcar como resuelta'}</button>
          </form>
        )}
        {participa ? <Responder hiloId={hilo.id} /> : <p className="rounded-xl bg-marca-suave px-4 py-3">Inscríbete en el curso para responder.</p>}
      </div>
    </div>
  );
}
