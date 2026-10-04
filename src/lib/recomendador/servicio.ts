import 'server-only';

import { contextoRecomendador, cursosPublicados, misCursos, tarjetasPorId, type TarjetaCurso } from '@/lib/consultas';

import { aprender, populares, recomendar, resumenIntereses, similares, type Estado } from './motor';

export type Fila = {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: 'continuar' | 'ia' | 'porque' | 'popular' | 'nuevos';
  cursos: TarjetaCurso[];
  razones?: Map<number, string>;
  progresos?: Map<number, number>;
};

/** Todo lo que necesita el inicio de un estudiante con sesion. */
export async function inicioPersonalizado(usuarioId: number): Promise<{ estado: Estado; filas: Fila[]; nombreTop?: string }> {
  const [ctx, mios, todos] = await Promise.all([contextoRecomendador(usuarioId), misCursos(usuarioId), cursosPublicados()]);
  const filas: Fila[] = [];

  const enCurso = mios.filter((m) => !m.completado);
  if (enCurso.length) {
    filas.push({
      id: 'continuar', tipo: 'continuar', titulo: 'Continúa aprendiendo', cursos: enCurso.map((m) => m.curso),
      progresos: new Map(enCurso.map((m) => [m.cursoId, m.porcentaje])),
    });
  }

  const { estado, recomendaciones } = recomendar(ctx, 12);
  if (recomendaciones.length) {
    filas.push({
      id: 'para-ti', tipo: 'ia', titulo: 'Recomendado para ti',
      descripcion: estado === 'preferencias'
        ? 'Basado en los intereses que elegiste. Mejorará a medida que estudies.'
        : 'Elegido por la IA según lo que estudias, terminas y calificas.',
      cursos: await tarjetasPorId(recomendaciones.map((r) => r.cursoId)),
      razones: new Map(recomendaciones.map((r) => [r.cursoId, r.razon.texto])),
    });
  }

  // "Porque te intereso X": vecinos del curso con mas afinidad.
  const ap = aprender(ctx);
  const top = [...ap.afinidad].filter(([, a]) => a > 0).sort((a, b) => b[1] - a[1])[0];
  let nombreTop: string | undefined;
  if (top) {
    const base = todos.find((c) => c.id === top[0]);
    const vecinos = similares(ctx, top[0], 10);
    if (base && vecinos.length >= 2) {
      nombreTop = base.titulo;
      filas.push({ id: 'porque', tipo: 'porque', titulo: `Porque te interesó «${base.titulo}»`, cursos: await tarjetasPorId(vecinos.map((v) => v.cursoId)) });
    }
  }

  // Popular en su categoria favorita (o en general si aun no hay datos).
  const favorita = resumenIntereses(ctx).intereses.find((i) => i.tipo === 'categoria');
  const slugFavorita = favorita?.rasgo.slice(4);
  const pop = populares(ctx, slugFavorita, 10);
  // Area con pocos cursos: se completa con lo mejor de toda la plataforma.
  if (pop.length < 4) for (const extra of populares(ctx, undefined, 10)) if (!pop.some((p) => p.cursoId === extra.cursoId)) pop.push(extra);
  if (pop.length) {
    filas.push({
      id: 'populares', tipo: 'popular',
      titulo: favorita && pop.length >= 4 && populares(ctx, slugFavorita, 10).length >= 4 ? `Lo más valorado en ${favorita.nombre}` : 'Lo más valorado por la comunidad',
      cursos: await tarjetasPorId(pop.map((p) => p.cursoId)),
    });
  }

  const nuevos = todos.filter((c) => !ctx.inscritos.has(c.id)).sort((a, b) => b.creado.getTime() - a.creado.getTime()).slice(0, 10);
  filas.push({ id: 'nuevos', tipo: 'nuevos', titulo: 'Recién publicados', cursos: nuevos });

  return { estado, filas, nombreTop };
}

/** Cursos parecidos para la pagina de un curso ("Estudiantes tambien vieron"). */
export async function tambienVieron(cursoId: number, usuarioId: number | null) {
  const ctx = usuarioId ? await contextoRecomendador(usuarioId) : await contextoAnonimo();
  return tarjetasPorId(similares(ctx, cursoId, 8).map((s) => s.cursoId));
}

async function contextoAnonimo() {
  // Sin sesion no hay historial: basta con la co-inscripcion de toda la comunidad.
  const ctx = await contextoRecomendador(-1);
  return { ...ctx, senales: [], preferencia: null, inscritos: new Set<number>() };
}
