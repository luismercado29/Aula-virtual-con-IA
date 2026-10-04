import { eq, sql } from 'drizzle-orm';

import { db, esquema as e } from '@/db';
import { libroDeCalificaciones } from '@/lib/consultas';
import { usuarioActual } from '@/lib/sesion';

/** Exporta el libro de calificaciones (abre bien en Excel: BOM UTF-8 y punto y coma). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActual();
  const curso = await db.query.cursos.findFirst({ where: eq(e.cursos.id, Number((await params).id)), columns: { id: true, slug: true, profesorId: true } });
  if (!usuario || !curso || (curso.profesorId !== usuario.id && usuario.rol !== 'admin')) return new Response('No autorizado', { status: 403 });
  const [{ total }] = await db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(e.lecciones).innerJoin(e.modulos, eq(e.modulos.id, e.lecciones.moduloId)).where(eq(e.modulos.cursoId, curso.id));
  const filas = await libroDeCalificaciones(curso.id);
  // Evita inyeccion de formulas en hojas de calculo (=, +, -, @ al inicio).
  const celda = (v: unknown) => { const s = String(v ?? ''); return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`; };
  const lineas = [
    ['Estudiante', 'Correo', 'Inscrito', 'Progreso (%)', 'Nota', 'Estado'].map(celda).join(';'),
    ...filas.map((f) => [f.nombre, f.email, f.inscrito.toISOString().slice(0, 10), total ? Math.round((f.hechas / total) * 100) : 0, f.nota ?? '', f.completado ? 'Completado' : 'En curso'].map(celda).join(';')),
  ];
  return new Response('﻿' + lineas.join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="calificaciones-${curso.slug}.csv"`, 'Cache-Control': 'no-store' },
  });
}
