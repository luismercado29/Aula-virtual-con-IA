'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db, esquema } from '@/db';
import { NIVELES } from '@/db/esquema';
import { registrarEvento } from '@/lib/eventos';
import { requerirUsuario } from '@/lib/sesion';

export async function noMeInteresaAccion(cursoId: number) {
  const usuario = await requerirUsuario();
  if (!Number.isInteger(cursoId)) return;
  await registrarEvento(usuario.id, 'no_interesa', { cursoId });
  revalidatePath('/');
}

const esquemaPreferencias = z.object({
  categorias: z.array(z.string().max(40)).max(12),
  temas: z.array(z.string().max(40)).max(20),
  nivel: z.enum(NIVELES).nullable(),
});

/** Bienvenida: lo que el estudiante dice que le interesa (punto de partida de la IA). */
export async function guardarPreferenciasAccion(datos: FormData) {
  const usuario = await requerirUsuario('/bienvenida');
  const nivel = String(datos.get('nivel') ?? '');
  const r = esquemaPreferencias.safeParse({
    categorias: datos.getAll('categorias').map(String),
    temas: datos.getAll('temas').map(String),
    nivel: NIVELES.includes(nivel as never) ? nivel : null,
  });
  if (!r.success) redirect('/bienvenida?error=1');
  const valores = { ...r.data, actualizado: new Date() };
  await db.insert(esquema.preferencias).values({ usuarioId: usuario.id, ...valores })
    .onConflictDoUpdate({ target: esquema.preferencias.usuarioId, set: valores });
  const omitido = !r.data.categorias.length && !r.data.temas.length && !r.data.nivel;
  await db.update(esquema.usuarios).set({ onboarding: omitido ? 'omitido' : 'completo' }).where(eq(esquema.usuarios.id, usuario.id));
  redirect('/?bienvenida=1');
}

/** "Prefiero que la IA aprenda de lo que vea": sin preferencias, arranque en frio. */
export async function omitirBienvenidaAccion() {
  const usuario = await requerirUsuario('/bienvenida');
  await db.update(esquema.usuarios).set({ onboarding: 'omitido' }).where(eq(esquema.usuarios.id, usuario.id));
  redirect('/?bienvenida=omitida');
}

/** Olvida el historial que usa el recomendador (no borra inscripciones ni notas). */
export async function reiniciarRecomendacionesAccion() {
  const usuario = await requerirUsuario('/perfil/intereses');
  await db.delete(esquema.eventos).where(and(
    eq(esquema.eventos.usuarioId, usuario.id),
    inArray(esquema.eventos.tipo, ['vista_curso', 'clic_recomendacion', 'busqueda', 'no_interesa']),
  ));
  await db.delete(esquema.preferencias).where(eq(esquema.preferencias.usuarioId, usuario.id));
  revalidatePath('/');
  redirect('/perfil/intereses?reiniciado=1');
}
