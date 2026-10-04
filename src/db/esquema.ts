import { relations, sql } from 'drizzle-orm';
import {
  boolean, check, index, integer, jsonb, pgTable, primaryKey, real, serial, smallint, text, timestamp, uniqueIndex,
} from 'drizzle-orm/pg-core';

export const ROLES = ['estudiante', 'profesor', 'admin'] as const;
export type Rol = (typeof ROLES)[number];
export const NIVELES = ['principiante', 'intermedio', 'avanzado'] as const;
export type Nivel = (typeof NIVELES)[number];
export const TIPOS_LECCION = ['lectura', 'video', 'evaluacion'] as const;
export type TipoLeccion = (typeof TIPOS_LECCION)[number];

/** Ajustes de accesibilidad que el usuario elige; tambien viven en una cookie para pintarlos sin parpadeo. */
export type PreferenciasAccesibilidad = {
  tamanoTexto: 100 | 125 | 150 | 175 | 200;
  altoContraste: boolean;
  fuenteLegible: boolean;
  subrayarEnlaces: boolean;
  reducirMovimiento: boolean;
  interlineado: 'normal' | 'amplio';
  velocidadVoz: number;
};

export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email').notNull(),
  hashClave: text('hash_clave').notNull(),
  rol: text('rol', { enum: ROLES }).notNull().default('estudiante'),
  titular: text('titular'), // p. ej. "Ingeniera de datos en ..."; lo ven los estudiantes del profesor
  bio: text('bio'),
  // pendiente -> aun no paso por la bienvenida; completo -> eligio intereses; omitido -> prefirio que la IA aprenda sola
  onboarding: text('onboarding', { enum: ['pendiente', 'completo', 'omitido'] }).notNull().default('pendiente'),
  accesibilidad: jsonb('accesibilidad').$type<Partial<PreferenciasAccesibilidad>>().notNull().default({}),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('usuarios_email_unico').on(sql`lower(${t.email})`)]);

export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull().default(''),
  icono: text('icono').notNull().default('book'),
  color: text('color').notNull().default('#4338CA'),
});

export const cursos = pgTable('cursos', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  titulo: text('titulo').notNull(),
  subtitulo: text('subtitulo').notNull().default(''),
  descripcion: text('descripcion').notNull().default(''), // markdown
  categoriaId: integer('categoria_id').notNull().references(() => categorias.id),
  profesorId: integer('profesor_id').notNull().references(() => usuarios.id),
  nivel: text('nivel', { enum: NIVELES }).notNull().default('principiante'),
  etiquetas: jsonb('etiquetas').$type<string[]>().notNull().default([]),
  aprenderas: jsonb('aprenderas').$type<string[]>().notNull().default([]),
  requisitos: jsonb('requisitos').$type<string[]>().notNull().default([]),
  estado: text('estado', { enum: ['borrador', 'publicado'] }).notNull().default('borrador'),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
  actualizado: timestamp('actualizado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('cursos_categoria').on(t.categoriaId), index('cursos_profesor').on(t.profesorId)]);

export const modulos = pgTable('modulos', {
  id: serial('id').primaryKey(),
  cursoId: integer('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  orden: smallint('orden').notNull(),
}, (t) => [index('modulos_curso').on(t.cursoId)]);

export const lecciones = pgTable('lecciones', {
  id: serial('id').primaryKey(),
  moduloId: integer('modulo_id').notNull().references(() => modulos.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  tipo: text('tipo', { enum: TIPOS_LECCION }).notNull().default('lectura'),
  contenido: text('contenido').notNull().default(''), // markdown
  videoUrl: text('video_url'),
  // Obligatoria para videos publicados: es lo que permite seguir la clase a personas sordas o ciegas.
  transcripcion: text('transcripcion').notNull().default(''),
  duracionMin: smallint('duracion_min').notNull().default(5),
  orden: smallint('orden').notNull(),
  vistaPrevia: boolean('vista_previa').notNull().default(false),
}, (t) => [index('lecciones_modulo').on(t.moduloId)]);

export type OpcionPregunta = { texto: string; correcta: boolean };

export const preguntas = pgTable('preguntas', {
  id: serial('id').primaryKey(),
  leccionId: integer('leccion_id').notNull().references(() => lecciones.id, { onDelete: 'cascade' }),
  enunciado: text('enunciado').notNull(),
  opciones: jsonb('opciones').$type<OpcionPregunta[]>().notNull(),
  explicacion: text('explicacion').notNull().default(''),
  orden: smallint('orden').notNull(),
});

export const inscripciones = pgTable('inscripciones', {
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  cursoId: integer('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
  completado: timestamp('completado', { withTimezone: true }),
  ultimaLeccionId: integer('ultima_leccion_id').references(() => lecciones.id, { onDelete: 'set null' }),
}, (t) => [primaryKey({ columns: [t.usuarioId, t.cursoId] }), index('inscripciones_curso').on(t.cursoId)]);

export const progreso = pgTable('progreso', {
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  leccionId: integer('leccion_id').notNull().references(() => lecciones.id, { onDelete: 'cascade' }),
  completada: timestamp('completada', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.usuarioId, t.leccionId] })]);

export const intentos = pgTable('intentos', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  leccionId: integer('leccion_id').notNull().references(() => lecciones.id, { onDelete: 'cascade' }),
  puntaje: smallint('puntaje').notNull(), // 0-100
  respuestas: jsonb('respuestas').$type<Record<string, number>>().notNull(),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('intentos_usuario_leccion').on(t.usuarioId, t.leccionId),
  check('puntaje_rango', sql`${t.puntaje} between 0 and 100`)]);

export const resenas = pgTable('resenas', {
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  cursoId: integer('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
  calificacion: smallint('calificacion').notNull(),
  comentario: text('comentario').notNull().default(''),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.usuarioId, t.cursoId] }), index('resenas_curso').on(t.cursoId),
  check('calificacion_rango', sql`${t.calificacion} between 1 and 5`)]);

export const hilos = pgTable('hilos', {
  id: serial('id').primaryKey(),
  cursoId: integer('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  leccionId: integer('leccion_id').references(() => lecciones.id, { onDelete: 'set null' }),
  titulo: text('titulo').notNull(),
  cuerpo: text('cuerpo').notNull(),
  resuelto: boolean('resuelto').notNull().default(false),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('hilos_curso').on(t.cursoId)]);

export const respuestas = pgTable('respuestas', {
  id: serial('id').primaryKey(),
  hiloId: integer('hilo_id').notNull().references(() => hilos.id, { onDelete: 'cascade' }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  cuerpo: text('cuerpo').notNull(),
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('respuestas_hilo').on(t.hiloId)]);

/** Lo que el estudiante dijo que le interesa en la bienvenida (punto de partida de la IA). */
export const preferencias = pgTable('preferencias', {
  usuarioId: integer('usuario_id').primaryKey().references(() => usuarios.id, { onDelete: 'cascade' }),
  categorias: jsonb('categorias').$type<string[]>().notNull().default([]),
  temas: jsonb('temas').$type<string[]>().notNull().default([]),
  nivel: text('nivel', { enum: NIVELES }),
  actualizado: timestamp('actualizado', { withTimezone: true }).notNull().defaultNow(),
});

export const TIPOS_EVENTO = [
  'vista_curso', 'clic_recomendacion', 'inscripcion', 'leccion_completada', 'curso_completado',
  'evaluacion', 'resena', 'busqueda', 'no_interesa', 'foro',
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

/** Todo lo que hace el estudiante y de lo que aprende el recomendador. */
export const eventos = pgTable('eventos', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: text('tipo', { enum: TIPOS_EVENTO }).notNull(),
  cursoId: integer('curso_id').references(() => cursos.id, { onDelete: 'cascade' }),
  valor: real('valor'), // puntaje de evaluacion, estrellas de la resena...
  texto: text('texto'), // termino de busqueda
  creado: timestamp('creado', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('eventos_usuario_fecha').on(t.usuarioId, t.creado)]);

// ---------------------------------------------------------------- relaciones
export const usuariosRel = relations(usuarios, ({ many, one }) => ({
  cursosDictados: many(cursos), inscripciones: many(inscripciones), preferencia: one(preferencias),
}));
export const categoriasRel = relations(categorias, ({ many }) => ({ cursos: many(cursos) }));
export const cursosRel = relations(cursos, ({ one, many }) => ({
  categoria: one(categorias, { fields: [cursos.categoriaId], references: [categorias.id] }),
  profesor: one(usuarios, { fields: [cursos.profesorId], references: [usuarios.id] }),
  modulos: many(modulos), inscripciones: many(inscripciones), resenas: many(resenas), hilos: many(hilos),
}));
export const modulosRel = relations(modulos, ({ one, many }) => ({
  curso: one(cursos, { fields: [modulos.cursoId], references: [cursos.id] }), lecciones: many(lecciones),
}));
export const leccionesRel = relations(lecciones, ({ one, many }) => ({
  modulo: one(modulos, { fields: [lecciones.moduloId], references: [modulos.id] }), preguntas: many(preguntas),
}));
export const preguntasRel = relations(preguntas, ({ one }) => ({
  leccion: one(lecciones, { fields: [preguntas.leccionId], references: [lecciones.id] }),
}));
export const inscripcionesRel = relations(inscripciones, ({ one }) => ({
  usuario: one(usuarios, { fields: [inscripciones.usuarioId], references: [usuarios.id] }),
  curso: one(cursos, { fields: [inscripciones.cursoId], references: [cursos.id] }),
}));
export const resenasRel = relations(resenas, ({ one }) => ({
  usuario: one(usuarios, { fields: [resenas.usuarioId], references: [usuarios.id] }),
  curso: one(cursos, { fields: [resenas.cursoId], references: [cursos.id] }),
}));
export const hilosRel = relations(hilos, ({ one, many }) => ({
  curso: one(cursos, { fields: [hilos.cursoId], references: [cursos.id] }),
  autor: one(usuarios, { fields: [hilos.usuarioId], references: [usuarios.id] }),
  respuestas: many(respuestas),
}));
export const respuestasRel = relations(respuestas, ({ one }) => ({
  hilo: one(hilos, { fields: [respuestas.hiloId], references: [hilos.id] }),
  autor: one(usuarios, { fields: [respuestas.usuarioId], references: [usuarios.id] }),
}));
export const preferenciasRel = relations(preferencias, ({ one }) => ({
  usuario: one(usuarios, { fields: [preferencias.usuarioId], references: [usuarios.id] }),
}));
