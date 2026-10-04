'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db, esquema as e } from '@/db';
import { inscripcion } from '@/lib/consultas';
import { registrarEvento } from '@/lib/eventos';
import { requerirUsuario } from '@/lib/sesion';

import type { EstadoFormulario } from './cuenta';

/** Pueden participar los inscritos, el profesor del curso y administracion. */
async function puedeParticipar(usuario: { id: number; rol: string }, cursoId: number) {
  const curso = await db.query.cursos.findFirst({ where: eq(e.cursos.id, cursoId), columns: { profesorId: true, slug: true } });
  if (!curso) return null;
  const ok = usuario.rol === 'admin' || curso.profesorId === usuario.id || !!(await inscripcion(usuario.id, cursoId));
  return ok ? curso : null;
}

const esquemaHilo = z.object({
  titulo: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres.').max(140),
  cuerpo: z.string().trim().min(10, 'Cuéntanos un poco más (mínimo 10 caracteres).').max(5000),
});

export async function crearHiloAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario();
  const cursoId = Number(datos.get('cursoId'));
  const curso = await puedeParticipar(usuario, cursoId);
  if (!curso) return { error: 'Debes estar inscrito en el curso para participar en el foro.' };
  const valores = { titulo: String(datos.get('titulo') ?? ''), cuerpo: String(datos.get('cuerpo') ?? '') };
  const r = esquemaHilo.safeParse(valores);
  if (!r.success) return { errores: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])), valores };
  const leccionId = Number(datos.get('leccionId')) || null;
  const [hilo] = await db.insert(e.hilos).values({ cursoId, usuarioId: usuario.id, leccionId, ...r.data }).returning({ id: e.hilos.id });
  await registrarEvento(usuario.id, 'foro', { cursoId });
  redirect(`/cursos/${curso.slug}/foro/${hilo.id}`);
}

export async function responderAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario();
  const hilo = await db.query.hilos.findFirst({ where: eq(e.hilos.id, Number(datos.get('hiloId'))) });
  if (!hilo) return { error: 'La conversación ya no existe.' };
  const curso = await puedeParticipar(usuario, hilo.cursoId);
  if (!curso) return { error: 'Debes estar inscrito en el curso para responder.' };
  const cuerpo = String(datos.get('cuerpo') ?? '').trim();
  if (cuerpo.length < 2) return { errores: { cuerpo: 'Escribe tu respuesta.' } };
  if (cuerpo.length > 5000) return { errores: { cuerpo: 'Máximo 5000 caracteres.' }, valores: { cuerpo } };
  await db.insert(e.respuestas).values({ hiloId: hilo.id, usuarioId: usuario.id, cuerpo });
  await registrarEvento(usuario.id, 'foro', { cursoId: hilo.cursoId });
  revalidatePath(`/cursos/${curso.slug}/foro/${hilo.id}`);
  return { ok: 'Respuesta publicada.' };
}

export async function alternarResueltoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const hilo = await db.query.hilos.findFirst({ where: eq(e.hilos.id, Number(datos.get('hiloId'))), with: { curso: { columns: { profesorId: true, slug: true } } } });
  if (!hilo) return;
  // Lo marca quien pregunto, el profesor o administracion.
  if (hilo.usuarioId !== usuario.id && hilo.curso.profesorId !== usuario.id && usuario.rol !== 'admin') return;
  await db.update(e.hilos).set({ resuelto: !hilo.resuelto }).where(eq(e.hilos.id, hilo.id));
  revalidatePath(`/cursos/${hilo.curso.slug}/foro/${hilo.id}`);
}
