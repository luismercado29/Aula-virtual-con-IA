/**
 * Motor de recomendacion hibrido.
 *
 * Aprende de lo que hace cada estudiante (vistas, inscripciones, lecciones
 * completadas, notas, resenas, busquedas, "no me interesa") y combina tres
 * senales:
 *
 *  1. Contenido: un perfil de intereses (categorias, temas y nivel) construido
 *     con las senales ponderadas; se compara con cada curso por similitud coseno.
 *  2. Colaborativa: "estudiantes que tomaron lo mismo que tu tambien tomaron...",
 *     con similitud coseno entre conjuntos de inscritos (item-item).
 *  3. Popularidad: inscritos y calificacion bayesiana, para no recomendar
 *     cursos malos ni desconocidos.
 *
 * El peso de cada senal cambia con la cantidad de datos: al principio manda lo
 * que el estudiante dijo en la bienvenida; a medida que consume, manda lo que
 * hace. Sin preferencias ni actividad no se inventa nada: el estado es "frio" y
 * la interfaz espera a que empiece a ver cursos.
 *
 * Es codigo puro (sin base de datos) para poder probarlo y razonarlo.
 */

export type Nivel = 'principiante' | 'intermedio' | 'avanzado';

export type CursoRec = {
  id: number;
  titulo: string;
  categoria: string; // slug
  categoriaNombre: string;
  etiquetas: string[];
  nivel: Nivel;
  inscritos: number;
  promedio: number | null; // 1..5
  nResenas: number;
  creado: Date;
};

export type TipoSenal =
  | 'vista_curso' | 'clic_recomendacion' | 'inscripcion' | 'leccion_completada' | 'curso_completado'
  | 'evaluacion' | 'resena' | 'busqueda' | 'no_interesa' | 'foro';

export type Senal = {
  tipo: TipoSenal;
  cursoId: number | null;
  valor: number | null;
  texto: string | null;
  creado: Date;
};

export type Preferencia = {
  categorias: string[];
  temas: string[];
  nivel: Nivel | null;
} | null;

export type Contexto = {
  cursos: CursoRec[];
  senales: Senal[];
  preferencia: Preferencia;
  /** Cursos en los que el estudiante ya esta inscrito (no se recomiendan). */
  inscritos: Set<number>;
  /** cursoId -> ids de los OTROS estudiantes inscritos (para la senal colaborativa). */
  inscritosPorCurso: Map<number, Set<number>>;
  ahora?: Date;
};

export type Razon =
  | { tipo: 'porque_viste'; texto: string; cursoRefId: number }
  | { tipo: 'estudiantes_similares'; texto: string; cursoRefId: number }
  | { tipo: 'siguiente_nivel'; texto: string; cursoRefId: number }
  | { tipo: 'interes'; texto: string; rasgo: string }
  | { tipo: 'preferencia'; texto: string; rasgo: string }
  | { tipo: 'popular'; texto: string };

export type Recomendacion = {
  cursoId: number;
  puntaje: number;
  razon: Razon;
  componentes: { contenido: number; colaborativo: number; popularidad: number; bonificacion: number };
};

export type Estado = 'frio' | 'preferencias' | 'aprendiendo';

// ------------------------------------------------------------------ parametros

/** Peso base de cada accion. Lo que mas compromiso exige, mas pesa. */
const PESO_BASE: Record<Exclude<TipoSenal, 'busqueda'>, (valor: number | null) => number> = {
  vista_curso: () => 1,
  clic_recomendacion: () => 1.5,
  foro: () => 1.5,
  leccion_completada: () => 1,
  inscripcion: () => 4,
  curso_completado: () => 6,
  // 50 es neutro: aprobar con 100 suma 2, reprobar con 0 resta 2.
  evaluacion: (v) => ((v ?? 50) - 50) / 25,
  // 3 estrellas es neutro: 5 suma 5, 1 resta 5.
  resena: (v) => ((v ?? 3) - 3) * 2.5,
  no_interesa: () => -10,
};

const VIDA_MEDIA_DIAS = 30;     // una senal de hace un mes vale la mitad
const PESO_CATEGORIA = 1;
const PESO_ETIQUETA = 0.7;
const PESO_NIVEL = 0.3;
const MAX_AFINIDAD_COLAB = 8;   // un solo curso muy consumido no debe dominar
const LAMBDA_DIVERSIDAD = 0.85; // 1 = solo relevancia, 0 = solo variedad
// Ponderacion por significancia: una similitud basada en pocos estudiantes en
// comun es poco confiable y se encoge (con 5 en comun vale la mitad).
const ENCOGIMIENTO_COLAB = 5;

// ------------------------------------------------------------------ utilidades

export function normalizar(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function decaimiento(fecha: Date, ahora: Date) {
  const dias = Math.max(0, (ahora.getTime() - fecha.getTime()) / 86_400_000);
  return Math.pow(0.5, dias / VIDA_MEDIA_DIAS);
}

type Vector = Map<string, number>;

export function rasgosCurso(c: CursoRec): Vector {
  const v: Vector = new Map();
  v.set(`cat:${c.categoria}`, PESO_CATEGORIA);
  for (const e of c.etiquetas) v.set(`tag:${normalizar(e)}`, PESO_ETIQUETA);
  v.set(`nivel:${c.nivel}`, PESO_NIVEL);
  return v;
}

function sumar(destino: Vector, origen: Vector, factor: number) {
  for (const [k, x] of origen) destino.set(k, (destino.get(k) ?? 0) + x * factor);
}

function coseno(a: Vector, b: Vector) {
  let punto = 0, na = 0, nb = 0;
  for (const [k, x] of a) { na += x * x; const y = b.get(k); if (y) punto += x * y; }
  for (const y of b.values()) nb += y * y;
  return na && nb ? punto / Math.sqrt(na * nb) : 0;
}

/** Similitud coseno entre los conjuntos de estudiantes de dos cursos, encogida si hay poca evidencia. */
function similitudColaborativa(a: Set<number> | undefined, b: Set<number> | undefined) {
  if (!a?.size || !b?.size) return 0;
  const [menor, mayor] = a.size < b.size ? [a, b] : [b, a];
  let comun = 0;
  for (const u of menor) if (mayor.has(u)) comun++;
  return (comun / Math.sqrt(a.size * b.size)) * (comun / (comun + ENCOGIMIENTO_COLAB));
}

const ORDEN_NIVEL: Record<Nivel, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

// ------------------------------------------------------------------ aprendizaje

export type Aprendizaje = {
  /** Afinidad neta por curso (puede ser negativa). */
  afinidad: Map<number, number>;
  /** Perfil de intereses: rasgo -> peso. */
  perfil: Vector;
  /** Cursos descartados con "no me interesa". */
  descartados: Set<number>;
  /** Cursos completados (para sugerir el siguiente nivel). */
  completados: Set<number>;
  senalesPositivas: number;
  estado: Estado;
};

export function aprender(ctx: Contexto): Aprendizaje {
  const ahora = ctx.ahora ?? new Date();
  const porId = new Map(ctx.cursos.map((c) => [c.id, c]));
  const afinidad = new Map<number, number>();
  const descartados = new Set<number>();
  const completados = new Set<number>();
  const perfil: Vector = new Map();
  let senalesPositivas = 0;

  for (const s of ctx.senales) {
    const d = decaimiento(s.creado, ahora);
    if (s.tipo === 'busqueda') {
      // Lo que busca tambien dice lo que le interesa, aunque aun no haya entrado a un curso.
      for (const palabra of normalizar(s.texto ?? '').split(/\s+/).filter((p) => p.length > 2)) {
        perfil.set(`tag:${palabra}`, (perfil.get(`tag:${palabra}`) ?? 0) + 0.8 * d);
      }
      continue;
    }
    if (s.cursoId == null || !porId.has(s.cursoId)) continue;
    const peso = PESO_BASE[s.tipo](s.valor) * d;
    afinidad.set(s.cursoId, (afinidad.get(s.cursoId) ?? 0) + peso);
    if (s.tipo === 'no_interesa') descartados.add(s.cursoId);
    if (s.tipo === 'curso_completado') completados.add(s.cursoId);
    if (peso > 0) senalesPositivas++;
  }

  for (const [cursoId, a] of afinidad) sumar(perfil, rasgosCurso(porId.get(cursoId)!), a);

  // Lo declarado en la bienvenida pesa al inicio y se diluye con la actividad real.
  const pref = ctx.preferencia;
  const tienePreferencias = !!pref && (pref.categorias.length > 0 || pref.temas.length > 0);
  if (pref) {
    const previo = 1 / (1 + senalesPositivas / 8);
    for (const c of pref.categorias) perfil.set(`cat:${c}`, (perfil.get(`cat:${c}`) ?? 0) + 3 * previo);
    for (const t of pref.temas) {
      const k = `tag:${normalizar(t)}`;
      perfil.set(k, (perfil.get(k) ?? 0) + 2 * previo);
    }
    if (pref.nivel) perfil.set(`nivel:${pref.nivel}`, (perfil.get(`nivel:${pref.nivel}`) ?? 0) + 1.5 * previo);
  }

  const estado: Estado = senalesPositivas > 0 ? 'aprendiendo' : tienePreferencias ? 'preferencias' : 'frio';
  return { afinidad, perfil, descartados, completados, senalesPositivas, estado };
}

// ------------------------------------------------------------------ recomendar

function popularidad(c: CursoRec, maxInscritos: number, mediaGlobal: number) {
  const C = 5; // resenas "virtuales" con la media global: evita que 1 resena de 5 estrellas gane
  const suma = (c.promedio ?? 0) * c.nResenas;
  const bayes = (C * mediaGlobal + suma) / (C + c.nResenas);
  const volumen = maxInscritos ? Math.log1p(c.inscritos) / Math.log1p(maxInscritos) : 0;
  return 0.6 * volumen + 0.4 * (bayes / 5);
}

export function recomendar(ctx: Contexto, limite = 12): { estado: Estado; recomendaciones: Recomendacion[] } {
  const ap = aprender(ctx);
  if (ap.estado === 'frio') return { estado: 'frio', recomendaciones: [] };

  const ahora = ctx.ahora ?? new Date();
  const porId = new Map(ctx.cursos.map((c) => [c.id, c]));
  const maxInscritos = Math.max(0, ...ctx.cursos.map((c) => c.inscritos));
  const conResenas = ctx.cursos.filter((c) => c.nResenas > 0);
  const mediaGlobal = conResenas.length
    ? conResenas.reduce((s, c) => s + (c.promedio ?? 0) * c.nResenas, 0) / conResenas.reduce((s, c) => s + c.nResenas, 0)
    : 4;

  // Cursos que le gustaron (base de la senal colaborativa y del "porque viste").
  const positivos = [...ap.afinidad].filter(([, a]) => a > 0).sort((x, y) => y[1] - x[1]);
  const totalAfinidad = positivos.reduce((s, [, a]) => s + Math.min(a, MAX_AFINIDAD_COLAB), 0) || 1;

  // Pesos de la mezcla: con mas datos, mas confianza en lo colaborativo.
  const n = positivos.length;
  const wContenido = 0.55;
  const wColab = n === 0 ? 0 : Math.min(0.35, 0.12 + n * 0.06);
  const wPop = 0.15;

  const candidatos: (Recomendacion & { rasgos: Vector })[] = [];
  for (const c of ctx.cursos) {
    if (ctx.inscritos.has(c.id) || ap.descartados.has(c.id)) continue;
    const rasgos = rasgosCurso(c);

    const contenido = Math.max(-1, coseno(ap.perfil, rasgos));

    let colab = 0, mejorRef: { id: number; aporte: number } | null = null;
    for (const [refId, a] of positivos) {
      const sim = similitudColaborativa(ctx.inscritosPorCurso.get(refId), ctx.inscritosPorCurso.get(c.id));
      const aporte = sim * Math.min(a, MAX_AFINIDAD_COLAB);
      colab += aporte;
      if (aporte > 0 && (!mejorRef || aporte > mejorRef.aporte)) mejorRef = { id: refId, aporte };
    }
    colab /= totalAfinidad;

    const pop = popularidad(c, maxInscritos, mediaGlobal);

    // Siguiente nivel natural de algo que ya termino en la misma categoria.
    let bonificacion = 0, refNivel: CursoRec | null = null;
    for (const id of ap.completados) {
      const hecho = porId.get(id);
      if (hecho && hecho.categoria === c.categoria && ORDEN_NIVEL[c.nivel] === ORDEN_NIVEL[hecho.nivel] + 1) {
        bonificacion = 0.15; refNivel = hecho;
      }
    }
    if ((ahora.getTime() - c.creado.getTime()) / 86_400_000 < 30) bonificacion += 0.03;

    const puntaje = wContenido * contenido + wColab * colab + wPop * pop + bonificacion;
    if (puntaje <= 0 || contenido < -0.05) continue; // algo que activamente no le interesa

    candidatos.push({
      cursoId: c.id, puntaje, rasgos,
      componentes: { contenido: wContenido * contenido, colaborativo: wColab * colab, popularidad: wPop * pop, bonificacion },
      razon: explicar(c, ap, ctx, { contenido: wContenido * contenido, colab: wColab * colab, mejorRef, refNivel, porId }),
    });
  }

  // Re-ranking MMR: relevancia alta pero sin diez cursos del mismo tema seguidos.
  candidatos.sort((a, b) => b.puntaje - a.puntaje);
  const elegidos: typeof candidatos = [];
  const pool = candidatos.slice(0, limite * 4);
  while (elegidos.length < limite && pool.length) {
    let mejorI = 0, mejorValor = -Infinity;
    pool.forEach((cand, i) => {
      const parecido = elegidos.length ? Math.max(...elegidos.map((e) => coseno(e.rasgos, cand.rasgos))) : 0;
      const valor = LAMBDA_DIVERSIDAD * cand.puntaje - (1 - LAMBDA_DIVERSIDAD) * parecido;
      if (valor > mejorValor) { mejorValor = valor; mejorI = i; }
    });
    elegidos.push(pool.splice(mejorI, 1)[0]);
  }

  return {
    estado: ap.estado,
    recomendaciones: elegidos.map(({ rasgos: _r, ...r }) => r),
  };
}

function explicar(
  c: CursoRec, ap: Aprendizaje, ctx: Contexto,
  d: { contenido: number; colab: number; mejorRef: { id: number } | null; refNivel: CursoRec | null; porId: Map<number, CursoRec> },
): Razon {
  if (d.refNivel) {
    return { tipo: 'siguiente_nivel', texto: `Siguiente paso después de «${d.refNivel.titulo}»`, cursoRefId: d.refNivel.id };
  }
  if (d.mejorRef && d.colab >= d.contenido * 0.6) {
    const ref = d.porId.get(d.mejorRef.id)!;
    return { tipo: 'estudiantes_similares', texto: `Quienes tomaron «${ref.titulo}» también tomaron este`, cursoRefId: ref.id };
  }
  // El rasgo del curso que mas pesa en el perfil del estudiante.
  let mejor: { k: string; v: number } | null = null;
  for (const [k, peso] of rasgosCurso(c)) {
    if (k.startsWith('nivel:')) continue;
    const v = (ap.perfil.get(k) ?? 0) * peso;
    if (v > 0 && (!mejor || v > mejor.v)) mejor = { k, v };
  }
  if (mejor) {
    const etiqueta = mejor.k.startsWith('cat:') ? c.categoriaNombre : etiquetaLegible(mejor.k, c);
    // Si el estudiante aun no ha consumido nada, el interes viene de lo que eligio al entrar.
    if (ap.senalesPositivas === 0) return { tipo: 'preferencia', texto: `Según tus intereses: ${etiqueta}`, rasgo: mejor.k };
    const viaCurso = [...ap.afinidad].filter(([, a]) => a > 0)
      .map(([id]) => d.porId.get(id)!)
      .find((v) => rasgosCurso(v).has(mejor!.k));
    if (viaCurso) return { tipo: 'porque_viste', texto: `Porque te interesó «${viaCurso.titulo}»`, cursoRefId: viaCurso.id };
    return { tipo: 'interes', texto: `Porque te interesa ${etiqueta}`, rasgo: mejor.k };
  }
  void ctx;
  return { tipo: 'popular', texto: `Popular en ${c.categoriaNombre}` };
}

function etiquetaLegible(rasgo: string, c: CursoRec) {
  const buscado = rasgo.slice(4);
  return c.etiquetas.find((e) => normalizar(e) === buscado) ?? buscado;
}

// ------------------------------------------------------------------ otras vistas

/** "Porque viste X": vecinos de un curso por co-inscripcion y contenido. */
export function similares(ctx: Contexto, cursoId: number, limite = 8) {
  const base = ctx.cursos.find((c) => c.id === cursoId);
  if (!base) return [];
  const rBase = rasgosCurso(base);
  const descartados = aprender(ctx).descartados;
  return ctx.cursos
    .filter((c) => c.id !== cursoId && !ctx.inscritos.has(c.id) && !descartados.has(c.id))
    .map((c) => ({
      cursoId: c.id,
      puntaje: 0.6 * similitudColaborativa(ctx.inscritosPorCurso.get(cursoId), ctx.inscritosPorCurso.get(c.id))
        + 0.4 * coseno(rBase, rasgosCurso(c)),
    }))
    .filter((x) => x.puntaje > 0.05)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite);
}

/** Lo mas valorado (para el estado frio y las filas por categoria). */
export function populares(ctx: Pick<Contexto, 'cursos' | 'inscritos'>, categoria?: string, limite = 12) {
  const maxInscritos = Math.max(0, ...ctx.cursos.map((c) => c.inscritos));
  return ctx.cursos
    .filter((c) => (!categoria || c.categoria === categoria) && !ctx.inscritos.has(c.id))
    .map((c) => ({ cursoId: c.id, puntaje: popularidad(c, maxInscritos, 4.3) }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite);
}

/** Lo que la IA cree que le interesa, para mostrarlo con transparencia. */
export function resumenIntereses(ctx: Contexto, limite = 8) {
  const { perfil, estado, senalesPositivas } = aprender(ctx);
  const nombres = new Map<string, string>();
  for (const c of ctx.cursos) {
    nombres.set(`cat:${c.categoria}`, c.categoriaNombre);
    for (const e of c.etiquetas) nombres.set(`tag:${normalizar(e)}`, e);
  }
  const positivos = [...perfil].filter(([k, v]) => v > 0 && !k.startsWith('nivel:'));
  const max = Math.max(0, ...positivos.map(([, v]) => v)) || 1;
  const intereses = positivos
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([k, v]) => ({
      rasgo: k,
      tipo: k.startsWith('cat:') ? 'categoria' as const : 'tema' as const,
      nombre: nombres.get(k) ?? k.slice(4),
      intensidad: Math.round((v / max) * 100),
    }));
  const niveles = (['principiante', 'intermedio', 'avanzado'] as const)
    .map((nv) => ({ nivel: nv, peso: perfil.get(`nivel:${nv}`) ?? 0 }));
  const nivelPreferido = niveles.reduce((a, b) => (b.peso > a.peso ? b : a)).peso > 0
    ? niveles.reduce((a, b) => (b.peso > a.peso ? b : a)).nivel : null;
  return { estado, senalesPositivas, intereses, nivelPreferido };
}
