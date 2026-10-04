import 'server-only';

import { db, esquema } from '@/db';
import type { TipoEvento } from '@/db/esquema';

/** Registra una accion del estudiante: es la materia prima del recomendador. */
export async function registrarEvento(
  usuarioId: number,
  tipo: TipoEvento,
  datos: { cursoId?: number | null; valor?: number | null; texto?: string | null } = {},
) {
  await db.insert(esquema.eventos).values({
    usuarioId, tipo,
    cursoId: datos.cursoId ?? null,
    valor: datos.valor ?? null,
    texto: datos.texto?.slice(0, 120) ?? null,
  });
}
