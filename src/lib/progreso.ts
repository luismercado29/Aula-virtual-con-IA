import 'server-only';

import { and, eq } from 'drizzle-orm';

import { db, esquema as e } from '@/db';

/**
 * Recuerda la ultima leccion abierta para "Continuar donde lo dejaste".
 * Solo de servidor: recibe el usuario ya autenticado por la pagina.
 */
export async function recordarLeccion(usuarioId: number, cursoId: number, leccionId: number) {
  await db.update(e.inscripciones).set({ ultimaLeccionId: leccionId })
    .where(and(eq(e.inscripciones.usuarioId, usuarioId), eq(e.inscripciones.cursoId, cursoId)));
}
