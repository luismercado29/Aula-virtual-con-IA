import { eq, sql } from 'drizzle-orm';
import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BarraProgreso } from '@/components/ui';
import { db, esquema as e } from '@/db';
import { libroDeCalificaciones } from '@/lib/consultas';
import { requerirRol } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Calificaciones' };

export default async function Estudiantes({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerirRol(['profesor', 'admin'], '/docencia');
  const curso = await db.query.cursos.findFirst({ where: eq(e.cursos.id, Number((await params).id)), columns: { id: true, titulo: true, profesorId: true } });
  if (!curso || (curso.profesorId !== usuario.id && usuario.rol !== 'admin')) notFound();
  const [filas, [{ total }]] = await Promise.all([
    libroDeCalificaciones(curso.id),
    db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(e.lecciones).innerJoin(e.modulos, eq(e.modulos.id, e.lecciones.moduloId)).where(eq(e.modulos.cursoId, curso.id)),
  ]);
  const conNota = filas.filter((f) => f.nota != null);
  const promedio = conNota.length ? Math.round(conNota.reduce((s, f) => s + (f.nota ?? 0), 0) / conNota.length) : null;

  return (
    <div className="contenedor py-10">
      <Link href={`/docencia/cursos/${curso.id}`} className="text-sm font-semibold text-marca hover:underline">← {curso.titulo}</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Libro de calificaciones</h1>
        {filas.length > 0 && <a href={`/docencia/cursos/${curso.id}/estudiantes/csv`} className="boton boton-secundario"><Download className="size-5" aria-hidden="true" />Descargar CSV</a>}
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="tarjeta p-5"><dt className="text-tinta-2">Estudiantes</dt><dd className="text-3xl font-bold">{filas.length}</dd></div>
        <div className="tarjeta p-5"><dt className="text-tinta-2">Completaron</dt><dd className="text-3xl font-bold">{filas.filter((f) => f.completado).length}</dd></div>
        <div className="tarjeta p-5"><dt className="text-tinta-2">Nota promedio</dt><dd className="text-3xl font-bold">{promedio != null ? `${promedio}/100` : '—'}</dd></div>
      </dl>
      {filas.length ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-borde bg-superficie">
          <table className="w-full min-w-[46rem] text-left">
            <caption className="sr-only">Progreso y mejor nota de cada estudiante del curso</caption>
            <thead className="bg-papel text-sm uppercase tracking-wider text-tinta-2">
              <tr><th scope="col" className="px-5 py-3">Estudiante</th><th scope="col" className="px-5 py-3">Inscrito</th><th scope="col" className="px-5 py-3">Progreso</th><th scope="col" className="px-5 py-3">Nota</th><th scope="col" className="px-5 py-3">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {filas.map((f) => {
                const pct = total ? Math.round((f.hechas / total) * 100) : 0;
                return (
                  <tr key={f.usuarioId}>
                    <th scope="row" className="px-5 py-3"><span className="block font-semibold">{f.nombre}</span><span className="text-sm font-normal text-tinta-2">{f.email}</span></th>
                    <td className="px-5 py-3">{f.inscrito.toLocaleDateString('es-CO')}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-28"><BarraProgreso valor={pct} etiqueta={`Progreso de ${f.nombre}`} /></div>{pct}%</div></td>
                    <td className="px-5 py-3">{f.nota != null ? <span className={f.nota >= 70 ? 'font-semibold text-exito' : 'font-semibold text-error'}>{f.nota}/100{f.nota < 70 && <span className="sr-only"> (no aprobada)</span>}</span> : '—'}</td>
                    <td className="px-5 py-3">{f.completado ? 'Completado' : 'En curso'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <p className="mt-8 text-tinta-2">Aún no hay estudiantes inscritos.</p>}
    </div>
  );
}
