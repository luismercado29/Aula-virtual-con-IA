CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"icono" text DEFAULT 'book' NOT NULL,
	"color" text DEFAULT '#4338CA' NOT NULL,
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cursos" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"titulo" text NOT NULL,
	"subtitulo" text DEFAULT '' NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"categoria_id" integer NOT NULL,
	"profesor_id" integer NOT NULL,
	"nivel" text DEFAULT 'principiante' NOT NULL,
	"etiquetas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"aprenderas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requisitos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estado" text DEFAULT 'borrador' NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cursos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"curso_id" integer,
	"valor" real,
	"texto" text,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hilos" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"leccion_id" integer,
	"titulo" text NOT NULL,
	"cuerpo" text NOT NULL,
	"resuelto" boolean DEFAULT false NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inscripciones" (
	"usuario_id" integer NOT NULL,
	"curso_id" integer NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	"completado" timestamp with time zone,
	"ultima_leccion_id" integer,
	CONSTRAINT "inscripciones_usuario_id_curso_id_pk" PRIMARY KEY("usuario_id","curso_id")
);
--> statement-breakpoint
CREATE TABLE "intentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"leccion_id" integer NOT NULL,
	"puntaje" smallint NOT NULL,
	"respuestas" jsonb NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "puntaje_rango" CHECK ("intentos"."puntaje" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "lecciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"modulo_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text DEFAULT 'lectura' NOT NULL,
	"contenido" text DEFAULT '' NOT NULL,
	"video_url" text,
	"transcripcion" text DEFAULT '' NOT NULL,
	"duracion_min" smallint DEFAULT 5 NOT NULL,
	"orden" smallint NOT NULL,
	"vista_previa" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modulos" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"orden" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferencias" (
	"usuario_id" integer PRIMARY KEY NOT NULL,
	"categorias" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"temas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"nivel" text,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preguntas" (
	"id" serial PRIMARY KEY NOT NULL,
	"leccion_id" integer NOT NULL,
	"enunciado" text NOT NULL,
	"opciones" jsonb NOT NULL,
	"explicacion" text DEFAULT '' NOT NULL,
	"orden" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progreso" (
	"usuario_id" integer NOT NULL,
	"leccion_id" integer NOT NULL,
	"completada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progreso_usuario_id_leccion_id_pk" PRIMARY KEY("usuario_id","leccion_id")
);
--> statement-breakpoint
CREATE TABLE "resenas" (
	"usuario_id" integer NOT NULL,
	"curso_id" integer NOT NULL,
	"calificacion" smallint NOT NULL,
	"comentario" text DEFAULT '' NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resenas_usuario_id_curso_id_pk" PRIMARY KEY("usuario_id","curso_id"),
	CONSTRAINT "calificacion_rango" CHECK ("resenas"."calificacion" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "respuestas" (
	"id" serial PRIMARY KEY NOT NULL,
	"hilo_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"cuerpo" text NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"hash_clave" text NOT NULL,
	"rol" text DEFAULT 'estudiante' NOT NULL,
	"titular" text,
	"bio" text,
	"onboarding" text DEFAULT 'pendiente' NOT NULL,
	"accesibilidad" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_profesor_id_usuarios_id_fk" FOREIGN KEY ("profesor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hilos" ADD CONSTRAINT "hilos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hilos" ADD CONSTRAINT "hilos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hilos" ADD CONSTRAINT "hilos_leccion_id_lecciones_id_fk" FOREIGN KEY ("leccion_id") REFERENCES "public"."lecciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_ultima_leccion_id_lecciones_id_fk" FOREIGN KEY ("ultima_leccion_id") REFERENCES "public"."lecciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_leccion_id_lecciones_id_fk" FOREIGN KEY ("leccion_id") REFERENCES "public"."lecciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecciones" ADD CONSTRAINT "lecciones_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferencias" ADD CONSTRAINT "preferencias_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_leccion_id_lecciones_id_fk" FOREIGN KEY ("leccion_id") REFERENCES "public"."lecciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progreso" ADD CONSTRAINT "progreso_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progreso" ADD CONSTRAINT "progreso_leccion_id_lecciones_id_fk" FOREIGN KEY ("leccion_id") REFERENCES "public"."lecciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_hilo_id_hilos_id_fk" FOREIGN KEY ("hilo_id") REFERENCES "public"."hilos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cursos_categoria" ON "cursos" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "cursos_profesor" ON "cursos" USING btree ("profesor_id");--> statement-breakpoint
CREATE INDEX "eventos_usuario_fecha" ON "eventos" USING btree ("usuario_id","creado");--> statement-breakpoint
CREATE INDEX "hilos_curso" ON "hilos" USING btree ("curso_id");--> statement-breakpoint
CREATE INDEX "inscripciones_curso" ON "inscripciones" USING btree ("curso_id");--> statement-breakpoint
CREATE INDEX "intentos_usuario_leccion" ON "intentos" USING btree ("usuario_id","leccion_id");--> statement-breakpoint
CREATE INDEX "lecciones_modulo" ON "lecciones" USING btree ("modulo_id");--> statement-breakpoint
CREATE INDEX "modulos_curso" ON "modulos" USING btree ("curso_id");--> statement-breakpoint
CREATE INDEX "resenas_curso" ON "resenas" USING btree ("curso_id");--> statement-breakpoint
CREATE INDEX "respuestas_hilo" ON "respuestas" USING btree ("hilo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_unico" ON "usuarios" USING btree (lower("email"));