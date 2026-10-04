'use server';

import { and, asc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db, esquema as e } from '@/db';
import { inscripcion } from '@/lib/consultas';
import { registrarEvento } from '@/lib/eventos';
import { requerirUsuario } from '@/lib/sesion';

import type { EstadoFormulario } from './cuenta';

async function cursoPublicado(cursoId: number) {
  return db.query.cursos.findFirst({ where: and(eq(e.cursos.id, cursoId), eq(e.cursos.estado, 'publicado')) });
}

export async function inscribirseAccion(datos: FormData) {
  const cursoId = Number(datos.get('cursoId'));
  const curso = await cursoPublicado(cursoId);
  if (!curso) redirect('/explorar');
  const usuario = await requerirUsuario(`/cursos/${curso.slug}`);
  const nueva = await db.insert(e.inscripciones).values({ usuarioId: usuario.id, cursoId }).onConflictDoNothing().returning();
  if (nueva.length) await registrarEvento(usuario.id, 'inscripcion', { cursoId });
  revalidatePath('/');
  redirect(`/aprender/${curso.slug}`);
}

/** Leccion de la que depende una accion, con su curso; verifica que el usuario este inscrito. */
async function leccionConCurso(usuarioId: number, leccionId: number) {
  const [fila] = await db.select({ leccion: e.lecciones, cursoId: e.modulos.cursoId, slug: e.cursos.slug })
    .from(e.lecciones).innerJoin(e.modulos, eq(e.modulos.id, e.lecciones.moduloId)).innerJoin(e.cursos, eq(e.cursos.id, e.modulos.cursoId))
    .where(eq(e.lecciones.id, leccionId));
  if (!fila || !(await inscripcion(usuarioId, fila.cursoId))) return null;
  return fila;
}

/** Marca la leccion y, si era la ultima pendiente, el curso como completado. */
async function marcarCompletada(usuarioId: number, leccionId: number, cursoId: number) {
  const nueva = await db.insert(e.progreso).values({ usuarioId, leccionId }).onConflictDoNothing().returning();
  if (!nueva.length) return;
  await registrarEvento(usuarioId, 'leccion_completada', { cursoId });
  const [{ total, hechas }] = await db.select({
    total: sql<number>`(select count(*) from lecciones l join modulos m on m.id = l.modulo_id where m.curso_id = ${cursoId})`.mapWith(Number),
    hechas: sql<number>`(select count(*) from progreso p join lecciones l on l.id = p.leccion_id join modulos m on m.id = l.modulo_id where m.curso_id = ${cursoId} and p.usuario_id = ${usuarioId})`.mapWith(Number),
  }).from(sql`(select 1) as x`);
  if (hechas >= total) {
    const r = await db.update(e.inscripciones).set({ completado: new Date() })
      .where(and(eq(e.inscripciones.usuarioId, usuarioId), eq(e.inscripciones.cursoId, cursoId), sql`${e.inscripciones.completado} is null`)).returning();
    if (r.length) await registrarEvento(usuarioId, 'curso_completado', { cursoId });
  }
}

export async function completarLeccionAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const leccionId = Number(datos.get('leccionId'));
  const fila = await leccionConCurso(usuario.id, leccionId);
  if (!fila) redirect('/mi-aprendizaje');
  if (fila.leccion.tipo !== 'evaluacion') await marcarCompletada(usuario.id, leccionId, fila.cursoId);
  const siguiente = Number(datos.get('siguienteId')) || null;
  revalidatePath(`/aprender/${fila.slug}`);
  redirect(siguiente ? `/aprender/${fila.slug}/${siguiente}` : `/aprender/${fila.slug}/${leccionId}?terminado=1`);
}

export type ResultadoEvaluacion = {
  puntaje?: number;
  aprobada?: boolean;
  detalle?: { preguntaId: number; correcta: boolean; elegida: number | null; correctaIndice: number; explicacion: string }[];
  error?: string;
};

export async function evaluarAccion(_: ResultadoEvaluacion, datos: FormData): Promise<ResultadoEvaluacion> {
  const usuario = await requerirUsuario();
  const leccionId = Number(datos.get('leccionId'));
  const fila = await leccionConCurso(usuario.id, leccionId);
  if (!fila || fila.leccion.tipo !== 'evaluacion') return { error: 'No puedes presentar esta evaluación.' };
  const preguntas = await db.query.preguntas.findMany({ where: eq(e.preguntas.leccionId, leccionId), orderBy: asc(e.preguntas.orden) });
  const faltantes = preguntas.filter((p) => datos.get(`p${p.id}`) == null);
  if (faltantes.length) return { error: `Responde todas las preguntas antes de enviar (faltan ${faltantes.length}).` };

  const respuestas: Record<string, number> = {};
  const detalle = preguntas.map((p) => {
    const elegida = Number(datos.get(`p${p.id}`));
    respuestas[p.id] = elegida;
    const correctaIndice = p.opciones.findIndex((o) => o.correcta);
    return { preguntaId: p.id, elegida, correctaIndice, correcta: elegida === correctaIndice, explicacion: p.explicacion };
  });
  const puntaje = Math.round((detalle.filter((d) => d.correcta).length / Math.max(1, preguntas.length)) * 100);
  const aprobada = puntaje >= 70;
  await db.insert(e.intentos).values({ usuarioId: usuario.id, leccionId, puntaje, respuestas });
  await registrarEvento(usuario.id, 'evaluacion', { cursoId: fila.cursoId, valor: puntaje });
  if (aprobada) await marcarCompletada(usuario.id, leccionId, fila.cursoId);
  revalidatePath(`/aprender/${fila.slug}`);
  return { puntaje, aprobada, detalle };
}

const esquemaResena = z.object({
  calificacion: z.coerce.number().int().min(1, 'Elige de 1 a 5 estrellas.').max(5),
  comentario: z.string().trim().max(1000, 'Máximo 1000 caracteres.'),
});

export async function resenarAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario();
  const cursoId = Number(datos.get('cursoId'));
  if (!(await inscripcion(usuario.id, cursoId))) return { error: 'Debes estar inscrito para dejar una reseña.' };
  const r = esquemaResena.safeParse({ calificacion: datos.get('calificacion'), comentario: datos.get('comentario') ?? '' });
  if (!r.success) return { errores: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  await db.insert(e.resenas).values({ usuarioId: usuario.id, cursoId, ...r.data })
    .onConflictDoUpdate({ target: [e.resenas.usuarioId, e.resenas.cursoId], set: { ...r.data, creado: new Date() } });
  await registrarEvento(usuario.id, 'resena', { cursoId, valor: r.data.calificacion });
  const curso = await db.query.cursos.findFirst({ where: eq(e.cursos.id, cursoId), columns: { slug: true } });
  revalidatePath(`/cursos/${curso?.slug}`);
  return { ok: '¡Gracias! Tu reseña ayuda a otros estudiantes y a la IA a recomendar mejor.' };
}
