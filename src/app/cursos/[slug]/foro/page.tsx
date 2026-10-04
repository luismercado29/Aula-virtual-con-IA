import { desc, eq, sql } from 'drizzle-orm';
import { CircleCheck, MessagesSquare } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { db, esquema as e } from '@/db';
import { cursoPorSlug, inscripcion } from '@/lib/consultas';
import { usuarioActual } from '@/lib/sesion';

import { NuevoHilo } from './FormulariosForo';

export const metadata: Metadata = { title: 'Foro del curso' };

export default async function Foro({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ leccion?: string }> }) {
  const [{ slug }, { leccion }, usuario] = await Promise.all([params, searchParams, usuarioActual()]);
  const curso = await cursoPorSlug(slug);
  if (!curso) notFound();
  const hilos = await db.select({
    id: e.hilos.id, titulo: e.hilos.titulo, resuelto: e.hilos.resuelto, creado: e.hilos.creado,
    autor: e.usuarios.nombre,
    respuestas: sql<number>`(select count(*) from respuestas r where r.hilo_id = ${sql.raw(`"hilos"."id"`)})`.mapWith(Number),
    profesorRespondio: sql<boolean>`exists(select 1 from respuestas r where r.hilo_id = ${sql.raw(`"hilos"."id"`)} and r.usuario_id = ${curso.profesorId})`,
  }).from(e.hilos).innerJoin(e.usuarios, eq(e.usuarios.id, e.hilos.usuarioId))
    .where(eq(e.hilos.cursoId, curso.id)).orderBy(desc(e.hilos.creado));
  const participa = usuario && (usuario.rol === 'admin' || usuario.id === curso.profesorId || !!(await inscripcion(usuario.id, curso.id)));

  return (
    <div className="contenedor max-w-4xl py-10">
      <Link href={`/cursos/${slug}`} className="text-sm font-semibold text-marca hover:underline">← {curso.titulo}</Link>
      <h1 className="mt-3 flex items-center gap-3 text-4xl font-bold tracking-tight"><MessagesSquare className="size-9 text-marca" aria-hidden="true" />Foro del curso</h1>
      <p className="mt-2 text-lg text-tinta-2">Pregunta, comparte y aprende con tus compañeros. {curso.profesor.nombre} participa respondiendo dudas.</p>

      <div className="mt-10 grid gap-10">
        {participa ? <NuevoHilo cursoId={curso.id} leccionId={Number(leccion) || undefined} /> : (
          <p className="rounded-xl bg-marca-suave px-4 py-3">Inscríbete en el curso para participar en el foro.</p>
        )}
        <section aria-labelledby="hilos-titulo">
          <h2 id="hilos-titulo" className="text-2xl font-bold">Conversaciones <span className="text-tinta-2">({hilos.length})</span></h2>
          {hilos.length ? (
            <ul className="mt-4 divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {hilos.map((h) => (
                <li key={h.id} className="relative p-5 hover:bg-papel">
                  <h3 className="font-bold"><Link href={`/cursos/${slug}/foro/${h.id}`} className="after:absolute after:inset-0">{h.titulo}</Link></h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tinta-2">
                    <span>{h.autor}</span>
                    <time dateTime={h.creado.toISOString()}>{h.creado.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</time>
                    <span>{h.respuestas} respuesta{h.respuestas === 1 ? '' : 's'}</span>
                    {h.resuelto && <span className="flex items-center gap-1 font-semibold text-exito"><CircleCheck className="size-4" aria-hidden="true" />Resuelta</span>}
                    {h.profesorRespondio && <span className="etiqueta-chip">Respondió el profesor</span>}
                  </p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-tinta-2">Aún no hay conversaciones. ¡Abre la primera!</p>}
        </section>
      </div>
    </div>
  );
}
