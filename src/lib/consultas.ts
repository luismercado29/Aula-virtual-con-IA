import 'server-only';

import { and, asc, desc, eq, gte, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { cache } from 'react';

import { db, esquema as e } from '@/db';
import type { Nivel } from '@/db/esquema';
import type { Contexto, CursoRec } from '@/lib/recomendador/motor';

// Referencias calificadas para subconsultas correlacionadas. Drizzle omite el
// nombre de la tabla cuando la consulta tiene una sola; dentro de una subconsulta
// eso vuelve ambigua (o, peor, mal resuelta) una columna como "id".
const C = {
  cursoId: sql.raw('"cursos"."id"'),
  categoriaId: sql.raw('"categorias"."id"'),
  inscCursoId: sql.raw('"inscripciones"."curso_id"'),
  inscCreado: sql.raw('"inscripciones"."creado"'),
  usuarioId: sql.raw('"usuarios"."id"'),
};

// ------------------------------------------------------------------ tarjetas de curso

export type TarjetaCurso = {
  id: number;
  slug: string;
  titulo: string;
  subtitulo: string;
  nivel: Nivel;
  etiquetas: string[];
  categoria: { slug: string; nombre: string; color: string; icono: string };
  profesor: string;
  inscritos: number;
  promedio: number | null;
  nResenas: number;
  duracionMin: number;
  nLecciones: number;
  creado: Date;
};

const agregados = {
  inscritos: sql<number>`(select count(*) from inscripciones i where i.curso_id = ${C.cursoId})`.mapWith(Number),
  promedio: sql<number | null>`(select round(avg(r.calificacion)::numeric, 1) from resenas r where r.curso_id = ${C.cursoId})`.mapWith((v) => (v == null ? null : Number(v))),
  nResenas: sql<number>`(select count(*) from resenas r where r.curso_id = ${C.cursoId})`.mapWith(Number),
  duracionMin: sql<number>`(select coalesce(sum(l.duracion_min), 0) from lecciones l join modulos m on m.id = l.modulo_id where m.curso_id = ${C.cursoId})`.mapWith(Number),
  nLecciones: sql<number>`(select count(*) from lecciones l join modulos m on m.id = l.modulo_id where m.curso_id = ${C.cursoId})`.mapWith(Number),
};

function baseTarjetas() {
  return db
    .select({
      id: e.cursos.id, slug: e.cursos.slug, titulo: e.cursos.titulo, subtitulo: e.cursos.subtitulo,
      nivel: e.cursos.nivel, etiquetas: e.cursos.etiquetas, creado: e.cursos.creado,
      categoria: { slug: e.categorias.slug, nombre: e.categorias.nombre, color: e.categorias.color, icono: e.categorias.icono },
      profesor: e.usuarios.nombre,
      ...agregados,
    })
    .from(e.cursos)
    .innerJoin(e.categorias, eq(e.categorias.id, e.cursos.categoriaId))
    .innerJoin(e.usuarios, eq(e.usuarios.id, e.cursos.profesorId));
}

/** Todos los cursos publicados (catalogo pequeno: se cachea por peticion). */
export const cursosPublicados = cache(async (): Promise<TarjetaCurso[]> =>
  baseTarjetas().where(eq(e.cursos.estado, 'publicado')).orderBy(desc(e.cursos.creado)));

export async function tarjetasPorId(ids: number[]) {
  const todos = await cursosPublicados();
  const porId = new Map(todos.map((c) => [c.id, c]));
  return ids.map((id) => porId.get(id)).filter((c): c is TarjetaCurso => !!c);
}

export const categoriasConConteo = cache(async () =>
  db.select({
    id: e.categorias.id, slug: e.categorias.slug, nombre: e.categorias.nombre, descripcion: e.categorias.descripcion,
    icono: e.categorias.icono, color: e.categorias.color,
    cursos: sql<number>`(select count(*) from cursos c where c.categoria_id = ${C.categoriaId} and c.estado = 'publicado')`.mapWith(Number),
  }).from(e.categorias).orderBy(asc(e.categorias.nombre)));

export type FiltrosCatalogo = { q?: string; categoria?: string; nivel?: string; orden?: string; duracion?: string; calificacion?: string };

export async function buscarCursos(f: FiltrosCatalogo) {
  const condiciones = [eq(e.cursos.estado, 'publicado')];
  const q = f.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[%_]/g, '')}%`;
    condiciones.push(or(
      ilike(e.cursos.titulo, patron), ilike(e.cursos.subtitulo, patron), ilike(e.usuarios.nombre, patron),
      sql`${e.cursos.etiquetas}::text ilike ${patron}`,
    )!);
  }
  if (f.categoria) condiciones.push(eq(e.categorias.slug, f.categoria));
  if (f.nivel && ['principiante', 'intermedio', 'avanzado'].includes(f.nivel)) condiciones.push(eq(e.cursos.nivel, f.nivel as Nivel));
  let filas = await baseTarjetas().where(and(...condiciones));
  if (f.calificacion) filas = filas.filter((c) => (c.promedio ?? 0) >= Number(f.calificacion));
  if (f.duracion === 'corto') filas = filas.filter((c) => c.duracionMin <= 120);
  if (f.duracion === 'medio') filas = filas.filter((c) => c.duracionMin > 120 && c.duracionMin <= 360);
  if (f.duracion === 'largo') filas = filas.filter((c) => c.duracionMin > 360);
  const orden = f.orden ?? (q ? 'relevancia' : 'populares');
  if (orden === 'populares') filas.sort((a, b) => b.inscritos - a.inscritos);
  if (orden === 'mejor') filas.sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0) || b.nResenas - a.nResenas);
  if (orden === 'nuevos') filas.sort((a, b) => b.creado.getTime() - a.creado.getTime());
  return filas;
}

// ------------------------------------------------------------------ detalle

export const cursoPorSlug = cache(async (slug: string) => {
  const curso = await db.query.cursos.findFirst({
    where: eq(e.cursos.slug, slug),
    with: {
      categoria: true,
      profesor: { columns: { id: true, nombre: true, titular: true, bio: true } },
      modulos: {
        orderBy: asc(e.modulos.orden),
        with: { lecciones: { orderBy: asc(e.lecciones.orden), columns: { contenido: false, transcripcion: false } } },
      },
    },
  });
  if (!curso) return null;
  const [stats] = await db.select(agregados).from(e.cursos).where(eq(e.cursos.id, curso.id));
  return { ...curso, ...stats };
});

export async function resenasDeCurso(cursoId: number, limite = 20) {
  const filas = await db.select({
    usuarioId: e.resenas.usuarioId, nombre: e.usuarios.nombre, calificacion: e.resenas.calificacion,
    comentario: e.resenas.comentario, creado: e.resenas.creado,
  }).from(e.resenas).innerJoin(e.usuarios, eq(e.usuarios.id, e.resenas.usuarioId))
    .where(eq(e.resenas.cursoId, cursoId)).orderBy(desc(e.resenas.creado)).limit(limite);
  const distribucion = await db.select({ estrellas: e.resenas.calificacion, n: sql<number>`count(*)`.mapWith(Number) })
    .from(e.resenas).where(eq(e.resenas.cursoId, cursoId)).groupBy(e.resenas.calificacion);
  return { resenas: filas, distribucion: new Map(distribucion.map((d) => [d.estrellas, d.n])) };
}

export async function inscripcion(usuarioId: number, cursoId: number) {
  return db.query.inscripciones.findFirst({
    where: and(eq(e.inscripciones.usuarioId, usuarioId), eq(e.inscripciones.cursoId, cursoId)),
  });
}

/** Lecciones completadas por el usuario dentro de un curso. */
export async function leccionesCompletadas(usuarioId: number, cursoId: number) {
  const filas = await db.select({ leccionId: e.progreso.leccionId }).from(e.progreso)
    .innerJoin(e.lecciones, eq(e.lecciones.id, e.progreso.leccionId))
    .innerJoin(e.modulos, eq(e.modulos.id, e.lecciones.moduloId))
    .where(and(eq(e.progreso.usuarioId, usuarioId), eq(e.modulos.cursoId, cursoId)));
  return new Set(filas.map((f) => f.leccionId));
}

/** Cursos del estudiante con su progreso, para "Mi aprendizaje" y "Continuar". */
export async function misCursos(usuarioId: number) {
  const filas = await db.select({
    cursoId: e.inscripciones.cursoId, inscrito: e.inscripciones.creado, completado: e.inscripciones.completado,
    ultimaLeccionId: e.inscripciones.ultimaLeccionId,
    total: sql<number>`(select count(*) from lecciones l join modulos m on m.id = l.modulo_id where m.curso_id = ${C.inscCursoId})`.mapWith(Number),
    hechas: sql<number>`(select count(*) from progreso p join lecciones l on l.id = p.leccion_id join modulos m on m.id = l.modulo_id where m.curso_id = ${C.inscCursoId} and p.usuario_id = ${usuarioId})`.mapWith(Number),
    nota: sql<number | null>`(select round(avg(mejor)) from (select max(i.puntaje) mejor from intentos i join lecciones l on l.id = i.leccion_id join modulos m on m.id = l.modulo_id where m.curso_id = ${C.inscCursoId} and i.usuario_id = ${usuarioId} group by i.leccion_id) t)`.mapWith((v) => (v == null ? null : Number(v))),
    actividad: sql<Date>`greatest(${C.inscCreado}, coalesce((select max(p.completada) from progreso p join lecciones l on l.id = p.leccion_id join modulos m on m.id = l.modulo_id where m.curso_id = ${C.inscCursoId} and p.usuario_id = ${usuarioId}), ${C.inscCreado}))`.mapWith((v) => new Date(v)),
  }).from(e.inscripciones).where(eq(e.inscripciones.usuarioId, usuarioId));
  const tarjetas = new Map((await tarjetasPorId(filas.map((f) => f.cursoId))).map((t) => [t.id, t]));
  return filas
    .filter((f) => tarjetas.has(f.cursoId))
    .map((f) => ({ ...f, curso: tarjetas.get(f.cursoId)!, porcentaje: f.total ? Math.round((f.hechas / f.total) * 100) : 0 }))
    .sort((a, b) => b.actividad.getTime() - a.actividad.getTime());
}

/** Primera leccion pendiente del curso (o la ultima vista). */
export async function leccionParaContinuar(usuarioId: number, cursoSlug: string) {
  const curso = await cursoPorSlug(cursoSlug);
  if (!curso) return null;
  const hechas = await leccionesCompletadas(usuarioId, curso.id);
  const todas = curso.modulos.flatMap((m) => m.lecciones);
  return todas.find((l) => !hechas.has(l.id)) ?? todas[0] ?? null;
}

// ------------------------------------------------------------------ recomendador

/** Arma todo lo que el motor necesita para un estudiante. */
export const contextoRecomendador = cache(async (usuarioId: number): Promise<Contexto> => {
  const tarjetas = await cursosPublicados();
  const cursos: CursoRec[] = tarjetas.map((t) => ({
    id: t.id, titulo: t.titulo, categoria: t.categoria.slug, categoriaNombre: t.categoria.nombre,
    etiquetas: t.etiquetas, nivel: t.nivel, inscritos: t.inscritos, promedio: t.promedio, nResenas: t.nResenas, creado: t.creado,
  }));
  const haceUnAno = new Date(Date.now() - 365 * 86_400_000);
  const [senales, pref, todas] = await Promise.all([
    db.select({ tipo: e.eventos.tipo, cursoId: e.eventos.cursoId, valor: e.eventos.valor, texto: e.eventos.texto, creado: e.eventos.creado })
      .from(e.eventos).where(and(eq(e.eventos.usuarioId, usuarioId), gte(e.eventos.creado, haceUnAno))),
    db.query.preferencias.findFirst({ where: eq(e.preferencias.usuarioId, usuarioId) }),
    db.select({ usuarioId: e.inscripciones.usuarioId, cursoId: e.inscripciones.cursoId }).from(e.inscripciones),
  ]);
  const inscritos = new Set<number>();
  const inscritosPorCurso = new Map<number, Set<number>>();
  for (const f of todas) {
    if (f.usuarioId === usuarioId) { inscritos.add(f.cursoId); continue; }
    if (!inscritosPorCurso.has(f.cursoId)) inscritosPorCurso.set(f.cursoId, new Set());
    inscritosPorCurso.get(f.cursoId)!.add(f.usuarioId);
  }
  return {
    cursos, senales, inscritos, inscritosPorCurso,
    preferencia: pref ? { categorias: pref.categorias, temas: pref.temas, nivel: pref.nivel } : null,
  };
});

// ------------------------------------------------------------------ docencia

export async function cursosDelProfesor(profesorId: number, esAdmin = false) {
  return baseTarjetas().where(esAdmin ? undefined : eq(e.cursos.profesorId, profesorId)).orderBy(desc(e.cursos.actualizado))
    .then(async (filas) => {
      const estados = await db.select({ id: e.cursos.id, estado: e.cursos.estado }).from(e.cursos)
        .where(inArray(e.cursos.id, filas.length ? filas.map((f) => f.id) : [0]));
      const porId = new Map(estados.map((x) => [x.id, x.estado]));
      return filas.map((f) => ({ ...f, estado: porId.get(f.id)! }));
    });
}

/** Libro de calificaciones: progreso y nota de cada estudiante en un curso. */
export async function libroDeCalificaciones(cursoId: number) {
  return db.select({
    usuarioId: e.usuarios.id, nombre: e.usuarios.nombre, email: e.usuarios.email,
    inscrito: e.inscripciones.creado, completado: e.inscripciones.completado,
    hechas: sql<number>`(select count(*) from progreso p join lecciones l on l.id = p.leccion_id join modulos m on m.id = l.modulo_id where m.curso_id = ${cursoId} and p.usuario_id = ${C.usuarioId})`.mapWith(Number),
    nota: sql<number | null>`(select round(avg(mejor)) from (select max(i.puntaje) mejor from intentos i join lecciones l on l.id = i.leccion_id join modulos m on m.id = l.modulo_id where m.curso_id = ${cursoId} and i.usuario_id = ${C.usuarioId} group by i.leccion_id) t)`.mapWith((v) => (v == null ? null : Number(v))),
  }).from(e.inscripciones).innerJoin(e.usuarios, eq(e.usuarios.id, e.inscripciones.usuarioId))
    .where(and(eq(e.inscripciones.cursoId, cursoId), ne(e.usuarios.rol, 'admin')))
    .orderBy(asc(e.usuarios.nombre));
}
