'use server';

import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db, esquema as e } from '@/db';
import { NIVELES, ROLES, TIPOS_LECCION } from '@/db/esquema';
import { requerirRol, type UsuarioSesion } from '@/lib/sesion';
import { problemasParaPublicar } from '@/lib/docencia';
import { urlInserto } from '@/lib/video';

const docente = () => requerirRol(['profesor', 'admin'], '/docencia');

/** El curso solo lo edita su profesor (o administracion). */
async function cursoEditable(usuario: UsuarioSesion, cursoId: number) {
  const curso = await db.query.cursos.findFirst({ where: eq(e.cursos.id, cursoId) });
  if (!curso || (curso.profesorId !== usuario.id && usuario.rol !== 'admin')) redirect('/docencia?aviso=sin-permiso');
  return curso;
}

async function leccionEditable(usuario: UsuarioSesion, leccionId: number) {
  const [fila] = await db.select({ leccion: e.lecciones, cursoId: e.modulos.cursoId }).from(e.lecciones)
    .innerJoin(e.modulos, eq(e.modulos.id, e.lecciones.moduloId)).where(eq(e.lecciones.id, leccionId));
  if (!fila) redirect('/docencia');
  await cursoEditable(usuario, fila.cursoId);
  return fila;
}

const tocar = (cursoId: number) => db.update(e.cursos).set({ actualizado: new Date() }).where(eq(e.cursos.id, cursoId));
const lineas = (v: FormDataEntryValue | null) => String(v ?? '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12);
const conError = (ruta: string, msg: string): never => redirect(`${ruta}?error=${encodeURIComponent(msg)}`);

function slugDe(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'curso';
}

const esquemaCurso = z.object({
  titulo: z.string().trim().min(5, 'El título necesita al menos 5 caracteres.').max(120),
  subtitulo: z.string().trim().max(200),
  categoria: z.string().min(1, 'Elige una categoría.'),
  nivel: z.enum(NIVELES),
});

export async function crearCursoAccion(datos: FormData) {
  const usuario = await docente();
  const r = esquemaCurso.safeParse({ titulo: datos.get('titulo'), subtitulo: datos.get('subtitulo') ?? '', categoria: datos.get('categoria'), nivel: datos.get('nivel') });
  if (!r.success) conError('/docencia', r.error.issues[0].message);
  const cat = await db.query.categorias.findFirst({ where: eq(e.categorias.slug, r.data!.categoria) });
  if (!cat) conError('/docencia', 'La categoría no existe.');
  let slug = slugDe(r.data!.titulo);
  if (await db.query.cursos.findFirst({ where: eq(e.cursos.slug, slug), columns: { id: true } })) slug = `${slug}-${Date.now().toString(36)}`;
  const [curso] = await db.insert(e.cursos).values({
    slug, titulo: r.data!.titulo, subtitulo: r.data!.subtitulo, categoriaId: cat!.id, profesorId: usuario.id, nivel: r.data!.nivel,
  }).returning({ id: e.cursos.id });
  await db.insert(e.modulos).values({ cursoId: curso.id, titulo: 'Introducción', orden: 1 });
  redirect(`/docencia/cursos/${curso.id}?ok=creado`);
}

export async function actualizarCursoAccion(datos: FormData) {
  const usuario = await docente();
  const curso = await cursoEditable(usuario, Number(datos.get('cursoId')));
  const ruta = `/docencia/cursos/${curso.id}`;
  const r = esquemaCurso.safeParse({ titulo: datos.get('titulo'), subtitulo: datos.get('subtitulo') ?? '', categoria: datos.get('categoria'), nivel: datos.get('nivel') });
  if (!r.success) conError(ruta, r.error.issues[0].message);
  const cat = await db.query.categorias.findFirst({ where: eq(e.categorias.slug, r.data!.categoria) });
  if (!cat) conError(ruta, 'La categoría no existe.');
  await db.update(e.cursos).set({
    titulo: r.data!.titulo, subtitulo: r.data!.subtitulo, nivel: r.data!.nivel, categoriaId: cat!.id,
    descripcion: String(datos.get('descripcion') ?? '').slice(0, 10_000),
    etiquetas: String(datos.get('etiquetas') ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
    aprenderas: lineas(datos.get('aprenderas')), requisitos: lineas(datos.get('requisitos')), actualizado: new Date(),
  }).where(eq(e.cursos.id, curso.id));
  revalidatePath(ruta);
  redirect(`${ruta}?ok=guardado`);
}

export async function cambiarEstadoAccion(datos: FormData) {
  const usuario = await docente();
  const curso = await cursoEditable(usuario, Number(datos.get('cursoId')));
  const ruta = `/docencia/cursos/${curso.id}`;
  if (curso.estado === 'borrador') {
    const problemas = await problemasParaPublicar(curso.id);
    if (problemas.length) conError(ruta, 'Resuelve los pendientes de la lista antes de publicar.');
  }
  await db.update(e.cursos).set({ estado: curso.estado === 'borrador' ? 'publicado' : 'borrador', actualizado: new Date() }).where(eq(e.cursos.id, curso.id));
  revalidatePath('/', 'layout');
  redirect(`${ruta}?ok=${curso.estado === 'borrador' ? 'publicado' : 'despublicado'}`);
}

export async function agregarModuloAccion(datos: FormData) {
  const usuario = await docente();
  const curso = await cursoEditable(usuario, Number(datos.get('cursoId')));
  const titulo = String(datos.get('titulo') ?? '').trim().slice(0, 120);
  if (titulo.length < 3) conError(`/docencia/cursos/${curso.id}`, 'El nombre del módulo es muy corto.');
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${e.modulos.orden}), 0)`.mapWith(Number) }).from(e.modulos).where(eq(e.modulos.cursoId, curso.id));
  await db.insert(e.modulos).values({ cursoId: curso.id, titulo, orden: max + 1 });
  await tocar(curso.id);
  redirect(`/docencia/cursos/${curso.id}?ok=modulo#contenido`);
}

export async function eliminarModuloAccion(datos: FormData) {
  const usuario = await docente();
  const modulo = await db.query.modulos.findFirst({ where: eq(e.modulos.id, Number(datos.get('moduloId'))) });
  if (!modulo) redirect('/docencia');
  await cursoEditable(usuario, modulo.cursoId);
  await db.delete(e.modulos).where(eq(e.modulos.id, modulo.id));
  await tocar(modulo.cursoId);
  redirect(`/docencia/cursos/${modulo.cursoId}?ok=eliminado#contenido`);
}

export async function agregarLeccionAccion(datos: FormData) {
  const usuario = await docente();
  const modulo = await db.query.modulos.findFirst({ where: eq(e.modulos.id, Number(datos.get('moduloId'))) });
  if (!modulo) redirect('/docencia');
  await cursoEditable(usuario, modulo.cursoId);
  const titulo = String(datos.get('titulo') ?? '').trim().slice(0, 140);
  const tipo = TIPOS_LECCION.includes(datos.get('tipo') as never) ? (datos.get('tipo') as (typeof TIPOS_LECCION)[number]) : 'lectura';
  if (titulo.length < 3) conError(`/docencia/cursos/${modulo.cursoId}`, 'El título de la lección es muy corto.');
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${e.lecciones.orden}), 0)`.mapWith(Number) }).from(e.lecciones).where(eq(e.lecciones.moduloId, modulo.id));
  const [l] = await db.insert(e.lecciones).values({ moduloId: modulo.id, titulo, tipo, orden: max + 1 }).returning({ id: e.lecciones.id });
  await tocar(modulo.cursoId);
  redirect(`/docencia/cursos/${modulo.cursoId}/lecciones/${l.id}`);
}

export async function actualizarLeccionAccion(datos: FormData) {
  const usuario = await docente();
  const { leccion, cursoId } = await leccionEditable(usuario, Number(datos.get('leccionId')));
  const ruta = `/docencia/cursos/${cursoId}/lecciones/${leccion.id}`;
  const titulo = String(datos.get('titulo') ?? '').trim().slice(0, 140);
  if (titulo.length < 3) conError(ruta, 'El título es muy corto.');
  const videoUrl = String(datos.get('videoUrl') ?? '').trim() || null;
  if (videoUrl && !urlInserto(videoUrl)) conError(ruta, 'El enlace del video no es válido. Usa YouTube, Vimeo o un MP4 por HTTPS.');
  await db.update(e.lecciones).set({
    titulo, videoUrl,
    contenido: String(datos.get('contenido') ?? '').slice(0, 50_000),
    transcripcion: String(datos.get('transcripcion') ?? '').slice(0, 100_000),
    duracionMin: Math.min(600, Math.max(1, Number(datos.get('duracionMin')) || 5)),
    vistaPrevia: datos.get('vistaPrevia') === 'on',
  }).where(eq(e.lecciones.id, leccion.id));
  await tocar(cursoId);
  redirect(`${ruta}?ok=guardado`);
}

export async function eliminarLeccionAccion(datos: FormData) {
  const usuario = await docente();
  const { leccion, cursoId } = await leccionEditable(usuario, Number(datos.get('leccionId')));
  await db.delete(e.lecciones).where(eq(e.lecciones.id, leccion.id));
  await tocar(cursoId);
  redirect(`/docencia/cursos/${cursoId}?ok=eliminado#contenido`);
}

export async function agregarPreguntaAccion(datos: FormData) {
  const usuario = await docente();
  const { leccion, cursoId } = await leccionEditable(usuario, Number(datos.get('leccionId')));
  const ruta = `/docencia/cursos/${cursoId}/lecciones/${leccion.id}`;
  const enunciado = String(datos.get('enunciado') ?? '').trim().slice(0, 500);
  const opciones = lineas(datos.get('opciones')).slice(0, 6);
  const correcta = Number(datos.get('correcta')) - 1;
  if (enunciado.length < 5) conError(ruta, 'Escribe el enunciado de la pregunta.');
  if (opciones.length < 2) conError(ruta, 'Escribe al menos 2 opciones, una por línea.');
  if (!(correcta >= 0 && correcta < opciones.length)) conError(ruta, 'Indica cuál opción es la correcta (su número).');
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${e.preguntas.orden}), 0)`.mapWith(Number) }).from(e.preguntas).where(eq(e.preguntas.leccionId, leccion.id));
  await db.insert(e.preguntas).values({
    leccionId: leccion.id, enunciado, orden: max + 1, explicacion: String(datos.get('explicacion') ?? '').trim().slice(0, 500),
    opciones: opciones.map((texto, i) => ({ texto, correcta: i === correcta })),
  });
  redirect(`${ruta}?ok=pregunta#preguntas`);
}

export async function eliminarPreguntaAccion(datos: FormData) {
  const usuario = await docente();
  const pregunta = await db.query.preguntas.findFirst({ where: eq(e.preguntas.id, Number(datos.get('preguntaId'))) });
  if (!pregunta) redirect('/docencia');
  const { cursoId } = await leccionEditable(usuario, pregunta.leccionId);
  await db.delete(e.preguntas).where(eq(e.preguntas.id, pregunta.id));
  redirect(`/docencia/cursos/${cursoId}/lecciones/${pregunta.leccionId}?ok=eliminado#preguntas`);
}

export async function cambiarRolAccion(datos: FormData) {
  const admin = await requerirRol(['admin'], '/docencia/usuarios');
  const id = Number(datos.get('usuarioId'));
  const rol = String(datos.get('rol'));
  if (!ROLES.includes(rol as never) || id === admin.id) redirect('/docencia/usuarios?error=No%20se%20pudo%20cambiar%20el%20rol');
  await db.update(e.usuarios).set({ rol: rol as (typeof ROLES)[number] }).where(and(eq(e.usuarios.id, id)));
  redirect('/docencia/usuarios?ok=rol');
}
