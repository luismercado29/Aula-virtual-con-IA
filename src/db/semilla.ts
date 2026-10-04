/**
 * Carga el catalogo de ejemplo y simula la actividad de una comunidad de
 * estudiantes (inscripciones, progreso, notas, resenas, foros y eventos), para
 * que el recomendador tenga patrones reales de los que aprender.
 *
 *   npm run db:seed            (solo sobre una base vacia)
 *   npm run db:seed -- --forzar  (agrega aunque ya haya cursos)
 *
 * Las contrasenas de las cuentas de demostracion se generan al azar y se
 * guardan en credenciales-demo.local (ignorado por git).
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

import { crearConexion } from './conexion';
import { APELLIDOS, CATEGORIAS, COMENTARIOS, CURSOS, NOMBRES, PERFILES, PROFESORES, type CursoSemilla } from './datos-semilla';
import * as e from './esquema';

const db = crearConexion();

// Generador pseudoaleatorio con semilla: los mismos datos en cada carga.
let estado = 20260415;
const azar = () => ((estado = (estado * 1664525 + 1013904223) % 4294967296) / 4294967296);
const entre = (a: number, b: number) => a + Math.floor(azar() * (b - a + 1));
const elegir = <T,>(xs: readonly T[]) => xs[Math.floor(azar() * xs.length)];
const hace = (dias: number, horas = 0) => new Date(Date.now() - dias * 86_400_000 - horas * 3_600_000);

function contenidoLeccion(curso: CursoSemilla, titulo: string, puntos: string[]) {
  return [
    `En esta lección de **${curso.titulo}** veremos ${titulo.charAt(0).toLowerCase() + titulo.slice(1)}. Tómate tu tiempo: puedes escucharla en voz alta con el botón «Escuchar lección» o ampliar el texto desde el menú de accesibilidad.`,
    '',
    '## Ideas clave',
    '',
    ...puntos.map((p) => `- ${p}`),
    '',
    '## En la práctica',
    '',
    `Piensa en un ejemplo de tu vida o tu trabajo donde aplique lo anterior. Escríbelo en una frase y, si quieres, compártelo en el foro del curso: explicar lo aprendido es una de las mejores formas de fijarlo.`,
    '',
    `> **Para recordar:** ${puntos[puntos.length - 1]}`,
  ].join('\n');
}

async function main() {
  const forzar = process.argv.includes('--forzar');
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(e.cursos);
  if (n > 0 && !forzar) {
    console.log(`La base ya tiene ${n} cursos. Usa --forzar para agregar de todos modos (o npm run db:reset en local).`);
    return;
  }

  // ---------------------------------------------------------------- personas
  const claves = { estudiante: randomBytes(9).toString('base64url'), profesor: randomBytes(9).toString('base64url'), admin: randomBytes(9).toString('base64url') };
  const hashInutilizable = await bcrypt.hash(randomBytes(32).toString('hex'), 10); // los estudiantes simulados no pueden entrar

  const categorias = await db.insert(e.categorias).values([...CATEGORIAS]).returning();
  const catPorSlug = new Map(categorias.map((c) => [c.slug, c]));

  const profesores = await db.insert(e.usuarios).values(PROFESORES.map((p) => ({
    nombre: p.nombre, email: `${p.clave}@aula.demo`, hashClave: hashInutilizable, rol: 'profesor' as const,
    titular: p.titular, bio: p.bio, onboarding: 'omitido' as const,
  }))).returning();
  const profPorClave = new Map(PROFESORES.map((p, i) => [p.clave, profesores[i]]));

  // Cuentas para probar la demo: un estudiante nuevo (vive la bienvenida y el arranque en frio),
  // una profesora (gestiona sus cursos) y una administradora.
  await db.update(e.usuarios).set({ hashClave: await bcrypt.hash(claves.profesor, 10) }).where(sql`${e.usuarios.id} = ${profPorClave.get('camila')!.id}`);
  await db.insert(e.usuarios).values([
    { nombre: 'Estudiante Demo', email: 'estudiante@aula.demo', hashClave: await bcrypt.hash(claves.estudiante, 10), rol: 'estudiante' },
    { nombre: 'Administración', email: 'admin@aula.demo', hashClave: await bcrypt.hash(claves.admin, 10), rol: 'admin', onboarding: 'omitido' },
  ]);

  const estudiantes = await db.insert(e.usuarios).values(Array.from({ length: 90 }, (_, i) => ({
    nombre: `${elegir(NOMBRES)} ${elegir(APELLIDOS)}`, email: `estudiante${i + 1}@aula.demo`,
    hashClave: hashInutilizable, rol: 'estudiante' as const, onboarding: 'completo' as const, creado: hace(entre(30, 300)),
  }))).returning();

  // ---------------------------------------------------------------- cursos
  type CursoCreado = { id: number; semilla: CursoSemilla; lecciones: { id: number; tipo: string }[]; calidad: number };
  const creados: CursoCreado[] = [];
  for (const c of CURSOS) {
    const [curso] = await db.insert(e.cursos).values({
      slug: c.slug, titulo: c.titulo, subtitulo: c.subtitulo, descripcion: c.descripcion,
      categoriaId: catPorSlug.get(c.categoria)!.id, profesorId: profPorClave.get(c.profesor as never)!.id,
      nivel: c.nivel, etiquetas: c.etiquetas, aprenderas: c.aprenderas, requisitos: c.requisitos,
      estado: 'publicado', creado: hace(c.diasDesdeCreacion), actualizado: hace(Math.min(c.diasDesdeCreacion, entre(1, 30))),
    }).returning();
    const lecciones: { id: number; tipo: string }[] = [];
    for (const [mi, m] of c.modulos.entries()) {
      const [modulo] = await db.insert(e.modulos).values({ cursoId: curso.id, titulo: m.titulo, orden: mi + 1 }).returning();
      for (const [li, l] of m.lecciones.entries()) {
        const [lec] = await db.insert(e.lecciones).values({
          moduloId: modulo.id, titulo: l.titulo, tipo: 'lectura', contenido: contenidoLeccion(c, l.titulo, l.puntos),
          duracionMin: l.min ?? entre(6, 18), orden: li + 1, vistaPrevia: !!l.previa,
        }).returning();
        lecciones.push({ id: lec.id, tipo: 'lectura' });
      }
    }
    // Evaluacion final en su propio modulo.
    const [modEval] = await db.insert(e.modulos).values({ cursoId: curso.id, titulo: 'Evaluación final', orden: c.modulos.length + 1 }).returning();
    const [lecEval] = await db.insert(e.lecciones).values({
      moduloId: modEval.id, titulo: `Evaluación: ${c.titulo}`, tipo: 'evaluacion', orden: 1, duracionMin: 10,
      contenido: 'Responde las preguntas para comprobar lo aprendido. Puedes intentarlo las veces que quieras; se guarda tu mejor nota. Necesitas 70 o más para aprobar.',
    }).returning();
    await db.insert(e.preguntas).values(c.evaluacion.map((p, i) => ({
      leccionId: lecEval.id, enunciado: p.enunciado, explicacion: p.explicacion, orden: i + 1,
      opciones: p.opciones.map((texto, j) => ({ texto, correcta: j === p.correcta })),
    })));
    lecciones.push({ id: lecEval.id, tipo: 'evaluacion' });
    creados.push({ id: curso.id, semilla: c, lecciones, calidad: 0.75 + azar() * 0.25 });
  }

  // ---------------------------------------------------------------- actividad simulada
  const inscripciones: (typeof e.inscripciones.$inferInsert)[] = [];
  const progreso: (typeof e.progreso.$inferInsert)[] = [];
  const intentos: (typeof e.intentos.$inferInsert)[] = [];
  const resenas: (typeof e.resenas.$inferInsert)[] = [];
  const eventos: (typeof e.eventos.$inferInsert)[] = [];
  const preferencias: (typeof e.preferencias.$inferInsert)[] = [];

  for (const est of estudiantes) {
    const perfil = elegir(PERFILES);
    preferencias.push({ usuarioId: est.id, categorias: perfil, temas: [], nivel: null });
    // Mayoria de cursos de sus categorias; de vez en cuando, uno de otra area.
    const afines = creados.filter((c) => perfil.includes(c.semilla.categoria));
    const otros = creados.filter((c) => !perfil.includes(c.semilla.categoria));
    const elegidos = new Set<CursoCreado>();
    const cuantos = entre(1, Math.min(4, afines.length));
    while (elegidos.size < cuantos) elegidos.add(elegir(afines));
    if (azar() < 0.3) elegidos.add(elegir(otros));

    // Tambien mira cursos que no toma (vistas sin inscripcion).
    for (let i = 0; i < entre(1, 4); i++) {
      const visto = azar() < 0.7 ? elegir(afines) : elegir(otros);
      eventos.push({ usuarioId: est.id, tipo: 'vista_curso', cursoId: visto.id, creado: hace(entre(1, 120), entre(0, 23)) });
    }

    for (const c of elegidos) {
      const dias = entre(5, 120);
      const inscrito = hace(dias, entre(0, 23));
      eventos.push({ usuarioId: est.id, tipo: 'vista_curso', cursoId: c.id, creado: inscrito });
      eventos.push({ usuarioId: est.id, tipo: 'inscripcion', cursoId: c.id, creado: inscrito });
      const avance = azar() < 0.45 ? 1 : azar(); // casi la mitad termina
      const lecturas = c.lecciones.filter((l) => l.tipo !== 'evaluacion');
      const hechas = Math.round(lecturas.length * avance);
      for (let i = 0; i < hechas; i++) {
        const cuando = hace(Math.max(0, dias - i * entre(1, 3)));
        progreso.push({ usuarioId: est.id, leccionId: lecturas[i].id, completada: cuando });
        eventos.push({ usuarioId: est.id, tipo: 'leccion_completada', cursoId: c.id, creado: cuando });
      }
      let completado: Date | null = null;
      if (hechas === lecturas.length) {
        const evalId = c.lecciones.find((l) => l.tipo === 'evaluacion')!.id;
        const puntaje = Math.min(100, Math.round(55 + c.calidad * 40 + entre(-10, 10)));
        const cuando = hace(Math.max(0, dias - lecturas.length * 2));
        intentos.push({ usuarioId: est.id, leccionId: evalId, puntaje, respuestas: {}, creado: cuando });
        eventos.push({ usuarioId: est.id, tipo: 'evaluacion', cursoId: c.id, valor: puntaje, creado: cuando });
        if (puntaje >= 70) {
          progreso.push({ usuarioId: est.id, leccionId: evalId, completada: cuando });
          completado = cuando;
          eventos.push({ usuarioId: est.id, tipo: 'curso_completado', cursoId: c.id, creado: cuando });
        }
      }
      inscripciones.push({ usuarioId: est.id, cursoId: c.id, creado: inscrito, completado });
      if (avance > 0.4 && azar() < 0.65) {
        const estrellas = Math.max(1, Math.min(5, Math.round(c.calidad * 5 + (azar() - 0.4))));
        const cuando = hace(Math.max(0, dias - 10));
        resenas.push({ usuarioId: est.id, cursoId: c.id, calificacion: estrellas, comentario: elegir(COMENTARIOS[estrellas]), creado: cuando });
        eventos.push({ usuarioId: est.id, tipo: 'resena', cursoId: c.id, valor: estrellas, creado: cuando });
      }
    }
  }

  const enLotes = async <T,>(filas: T[], insertar: (lote: T[]) => Promise<unknown>) => {
    for (let i = 0; i < filas.length; i += 500) await insertar(filas.slice(i, i + 500));
  };
  await enLotes(preferencias, (l) => db.insert(e.preferencias).values(l));
  await enLotes(inscripciones, (l) => db.insert(e.inscripciones).values(l));
  await enLotes(progreso, (l) => db.insert(e.progreso).values(l).onConflictDoNothing());
  await enLotes(intentos, (l) => db.insert(e.intentos).values(l));
  await enLotes(resenas, (l) => db.insert(e.resenas).values(l).onConflictDoNothing());
  await enLotes(eventos, (l) => db.insert(e.eventos).values(l));

  // ---------------------------------------------------------------- foros
  const PREGUNTAS_FORO = [
    ['¿Alguien tiene un ejemplo adicional?', 'Entendí la teoría pero me cuesta aplicarla. ¿Pueden compartir un ejemplo de su trabajo?'],
    ['Duda con la evaluación', 'En la pregunta 2 dudé entre dos opciones. ¿Alguien me explica por qué es la correcta?'],
    ['Recursos para profundizar', '¿Qué libros o sitios recomiendan para seguir aprendiendo de este tema?'],
  ];
  for (const c of creados.slice(0, 10)) {
    const autor = elegir(estudiantes);
    const [p, cuerpo] = elegir(PREGUNTAS_FORO);
    const [hilo] = await db.insert(e.hilos).values({ cursoId: c.id, usuarioId: autor.id, titulo: p, cuerpo, creado: hace(entre(3, 40)), resuelto: azar() < 0.5 }).returning();
    const prof = profPorClave.get(c.semilla.profesor as never)!;
    await db.insert(e.respuestas).values([
      { hiloId: hilo.id, usuarioId: prof.id, cuerpo: '¡Muy buena pregunta! Te dejo un ejemplo: revisa la lección 2, donde aplicamos la idea paso a paso. Si sigues con dudas, cuéntame en qué parte te quedas.', creado: hace(entre(1, 3)) },
      { hiloId: hilo.id, usuarioId: elegir(estudiantes).id, cuerpo: 'A mí me ayudó hacer el ejercicio dos veces y escuchar la lección en voz alta.', creado: hace(1) },
    ]);
  }

  writeFileSync('credenciales-demo.local', [
    'Cuentas de demostracion (generadas al cargar los datos; NO subir a git)',
    `estudiante@aula.demo  ${claves.estudiante}   (estudiante nuevo: vive la bienvenida)`,
    `camila@aula.demo      ${claves.profesor}   (profesora)`,
    `admin@aula.demo       ${claves.admin}   (administración)`,
    '',
  ].join('\n'));
  console.log(`Listo: ${CATEGORIAS.length} categorías, ${creados.length} cursos, ${estudiantes.length} estudiantes simulados, ${inscripciones.length} inscripciones, ${resenas.length} reseñas, ${eventos.length} eventos.`);
  console.log('Credenciales de demostración en credenciales-demo.local');
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
