# Aula IA · Aula virtual con recomendaciones inteligentes

Plataforma de cursos en línea (al estilo de Coursera o Udemy) cuyo fuerte es un **recomendador que
aprende de lo que consume cada estudiante**, como Netflix, y que es **accesible para personas con
discapacidad**, incluidas personas ciegas o con baja visión.

## Qué incluye

**Para estudiantes**
- Bienvenida que pregunta intereses (áreas, temas y nivel). Es opcional: si se omite, la IA espera a que el estudiante explore.
- Inicio personalizado con filas tipo Netflix: *Continúa aprendiendo*, *Recomendado para ti* (cada curso explica por qué), *Porque te interesó X*, *Lo más valorado* y *Recién publicados*.
- Catálogo con búsqueda y filtros, y página de curso con temario, profesor, reseñas y cursos relacionados.
- Reproductor de lecciones (lectura, video con transcripción y evaluación con retroalimentación), progreso y constancia al completar.
- Foros por curso, reseñas con estrellas y calificaciones en *Mi aprendizaje*.
- *Lo que la IA sabe de ti*: intereses detectados, historial observado, editar intereses o reiniciar la IA.

**Para profesores**
- Panel de docencia para crear cursos, módulos y lecciones (Markdown, video y evaluaciones).
- Publicación con verificaciones: no deja publicar un video sin transcripción.
- Libro de calificaciones con exportación a CSV y respuestas en el foro destacadas.

**Administración:** gestión de roles (estudiante, profesor y administración).

## El recomendador

Código puro y probado en `src/lib/recomendador/motor.ts`. Es un **híbrido** que combina tres señales:

1. **Contenido:** un perfil de intereses (áreas, temas y nivel) construido con las acciones del estudiante, comparado con cada curso por similitud coseno.
2. **Colaborativo item-item:** «quienes tomaron lo mismo que tú también tomaron…», con ponderación por significancia para no dejarse engañar por coincidencias de pocos estudiantes.
3. **Popularidad bayesiana:** volumen de estudiantes y calificación ajustada.

Además:
- Cada acción tiene un peso según el compromiso que muestra: inscribirse +4, terminar +6, una reseña de 1★ −5, «no me interesa» −10, etc. Lo antiguo pierde peso con una vida media de 30 días.
- Las búsquedas también cuentan como interés.
- Lo declarado en la bienvenida pesa al principio y se diluye a medida que el estudiante estudia.
- Sugiere el siguiente nivel de un curso terminado y reordena con MMR para mezclar áreas.
- **Arranque en frío honesto:** sin preferencias ni actividad no recomienda nada y lo explica.
- Cada recomendación trae su explicación legible.

## Accesibilidad (WCAG 2.2 AA)

- Estructura semántica, nombres accesibles y regiones vivas para anunciar resultados.
- Navegación completa por teclado, con foco visible y enlace para saltar al contenido.
- Panel de ajustes: texto hasta 200 %, alto contraste, fuente Atkinson Hyperlegible (para baja visión), espaciado amplio, enlaces subrayados y reducir movimiento. Se aplican desde el servidor, sin parpadeo, y se guardan en la cuenta.
- Lectura de lecciones en voz alta (Web Speech API) con velocidad ajustable.
- Transcripción obligatoria en los videos publicados y subtítulos activados en los reproductores insertados.
- Auditado con axe-core en las páginas principales, en escritorio y móvil, sin violaciones.

## Diseño y rendimiento

- Estilo editorial: titulares que mezclan Instrument Sans con Instrument Serif itálica.
- Portada animada con **GSAP** (SplitText y ScrollTrigger) y **Lenis**. Las animaciones solo corren si el usuario no pidió reducir el movimiento, y la cinta animada tiene botón de pausa.
- Portadas de curso generadas con CSS: sin imágenes que descargar.
- Fuentes servidas desde el propio dominio con `next/font`.
- Contenido renderizado en el servidor: funciona aunque falle JavaScript.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM ·
Postgres (Neon en producción, **PGlite** embebido en desarrollo) · Vitest.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # sin DATABASE_URL usa una base local embebida: no hay que instalar Postgres
npm run db:reset            # crea las tablas y carga el catálogo de ejemplo
npm run dev
```

`db:reset` genera cuentas de demostración (estudiante, profesora y administración) con contraseñas
aleatorias en `credenciales-demo.local`, un archivo que no se sube a git.

```bash
npm test          # pruebas del recomendador
npm run typecheck
npm run build
```

## Despliegue (Vercel + Neon)

1. Crea una base Neon y define en Vercel `DATABASE_URL` y `AUTH_SECRET`.
2. Desde tu equipo, con `DATABASE_URL` apuntando a Neon: `npm run db:migrate` y `npm run db:seed`.

## Seguridad

- Contraseñas con bcrypt.
- Sesión en cookie firmada (JWT HS256), `HttpOnly`, `Secure` y `SameSite=Lax`.
- Límite de intentos de inicio de sesión.
- Autorización en cada acción del servidor.
- Markdown de profesores saneado.
- CSV protegido contra inyección de fórmulas.
- Cabeceras de seguridad configuradas.
