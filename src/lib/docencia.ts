import 'server-only';

import { eq, sql } from 'drizzle-orm';

import { db, esquema as e } from '@/db';
import { urlInserto } from '@/lib/video';

/** Verificaciones antes de publicar (contenido minimo y accesibilidad). */
export async function problemasParaPublicar(cursoId: number) {
  const lecciones = await db.select({ id: e.lecciones.id, titulo: e.lecciones.titulo, tipo: e.lecciones.tipo, transcripcion: e.lecciones.transcripcion, videoUrl: e.lecciones.videoUrl, contenido: e.lecciones.contenido,
    preguntas: sql<number>`(select count(*) from preguntas p where p.leccion_id = ${e.lecciones.id})`.mapWith(Number) })
    .from(e.lecciones).innerJoin(e.modulos, eq(e.modulos.id, e.lecciones.moduloId)).where(eq(e.modulos.cursoId, cursoId));
  const problemas: string[] = [];
  if (lecciones.length < 2) problemas.push('Agrega al menos 2 lecciones.');
  for (const l of lecciones) {
    if (l.tipo === 'video' && !l.transcripcion.trim()) problemas.push(`«${l.titulo}»: falta la transcripción del video (la necesitan personas sordas o ciegas).`);
    if (l.tipo === 'video' && !urlInserto(l.videoUrl)) problemas.push(`«${l.titulo}»: el enlace del video no es válido (YouTube, Vimeo o archivo MP4 por HTTPS).`);
    if (l.tipo === 'evaluacion' && l.preguntas === 0) problemas.push(`«${l.titulo}»: la evaluación no tiene preguntas.`);
    if (l.tipo === 'lectura' && l.contenido.trim().length < 30) problemas.push(`«${l.titulo}»: la lectura está vacía o es muy corta.`);
  }
  return problemas;
}
