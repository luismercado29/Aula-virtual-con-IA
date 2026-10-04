import { describe, expect, it } from 'vitest';

import { type Contexto, type CursoRec, type Senal, populares, recomendar, resumenIntereses, similares } from './motor';

const AHORA = new Date('2026-10-01T12:00:00Z');
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 86_400_000);

let siguienteId = 1;
function curso(p: Partial<CursoRec> & Pick<CursoRec, 'categoria'>): CursoRec {
  const id = siguienteId++;
  return {
    id, titulo: `Curso ${id}`, categoriaNombre: p.categoria, etiquetas: [], nivel: 'principiante',
    inscritos: 50, promedio: 4.5, nResenas: 10, creado: hace(200), ...p,
  };
}

const python1 = curso({ categoria: 'datos', etiquetas: ['Python', 'Pandas'], titulo: 'Python para datos' });
const python2 = curso({ categoria: 'datos', etiquetas: ['Python', 'Machine Learning'], nivel: 'intermedio', titulo: 'ML con Python' });
const sql = curso({ categoria: 'datos', etiquetas: ['SQL'], titulo: 'SQL desde cero' });
const figma = curso({ categoria: 'diseno', etiquetas: ['Figma', 'UX'], titulo: 'Figma' });
const ux = curso({ categoria: 'diseno', etiquetas: ['UX', 'Investigación'], titulo: 'Investigación UX' });
const color = curso({ categoria: 'diseno', etiquetas: ['Color', 'Tipografía'], titulo: 'Color y tipografía' });
const ventas = curso({ categoria: 'negocios', etiquetas: ['Ventas'], titulo: 'Ventas consultivas', inscritos: 400 });
const ingles = curso({ categoria: 'idiomas', etiquetas: ['Inglés'], titulo: 'Inglés B1', inscritos: 300 });
const CURSOS = [python1, python2, sql, figma, ux, color, ventas, ingles];

function ctx(over: Partial<Contexto> = {}): Contexto {
  return {
    cursos: CURSOS, senales: [], preferencia: null, inscritos: new Set(),
    inscritosPorCurso: new Map(), ahora: AHORA, ...over,
  };
}
const senal = (tipo: Senal['tipo'], cursoId: number | null, dias = 1, extra: Partial<Senal> = {}): Senal =>
  ({ tipo, cursoId, valor: null, texto: null, creado: hace(dias), ...extra });
const ids = (r: ReturnType<typeof recomendar>) => r.recomendaciones.map((x) => x.cursoId);

describe('arranque en frio', () => {
  it('sin preferencias ni actividad no recomienda nada: espera a que el estudiante consuma', () => {
    const r = recomendar(ctx());
    expect(r.estado).toBe('frio');
    expect(r.recomendaciones).toEqual([]);
  });

  it('con preferencias de la bienvenida recomienda segun lo que eligio', () => {
    const r = recomendar(ctx({ preferencia: { categorias: ['diseno'], temas: [], nivel: null } }));
    expect(r.estado).toBe('preferencias');
    expect(ids(r).slice(0, 3).every((id) => [figma.id, ux.id, color.id].includes(id))).toBe(true);
    expect(r.recomendaciones[0].razon.tipo).toBe('preferencia');
  });

  it('una busqueda ya cuenta como interes', () => {
    const r = recomendar(ctx({ senales: [senal('busqueda', null, 0, { texto: 'figma ux' })], preferencia: { categorias: [], temas: ['figma'], nivel: null } }));
    expect(ids(r)[0]).toBe(figma.id);
  });
});

describe('aprende de lo que consume', () => {
  it('ver e inscribirse en cursos de datos cambia las recomendaciones hacia datos', () => {
    const antes = recomendar(ctx({ preferencia: { categorias: ['diseno'], temas: [], nivel: null } }));
    const despues = recomendar(ctx({
      preferencia: { categorias: ['diseno'], temas: [], nivel: null },
      senales: [senal('vista_curso', python1.id), senal('inscripcion', python1.id), senal('curso_completado', python1.id),
        senal('vista_curso', sql.id), senal('inscripcion', sql.id)],
      inscritos: new Set([python1.id, sql.id]),
    }));
    expect(antes.recomendaciones[0].cursoId).not.toBe(python2.id);
    expect(despues.estado).toBe('aprendiendo');
    expect(ids(despues)[0]).toBe(python2.id);
  });

  it('no recomienda cursos en los que ya esta inscrito', () => {
    const r = recomendar(ctx({ senales: [senal('inscripcion', figma.id)], inscritos: new Set([figma.id]) }));
    expect(ids(r)).not.toContain(figma.id);
  });

  it('"no me interesa" saca el curso y baja su tema', () => {
    const r = recomendar(ctx({
      preferencia: { categorias: ['diseno'], temas: [], nivel: null },
      senales: [senal('no_interesa', color.id, 0)],
    }));
    expect(ids(r)).not.toContain(color.id);
  });

  it('una resena de 1 estrella penaliza los cursos parecidos', () => {
    const base = { preferencia: { categorias: ['diseno', 'datos'], temas: [] as string[], nivel: null } };
    const conMala = recomendar(ctx({ ...base, senales: [senal('resena', figma.id, 0, { valor: 1 })], inscritos: new Set([figma.id]) }));
    const posUx = ids(conMala).indexOf(ux.id);
    const posPython = ids(conMala).indexOf(python1.id);
    expect(posPython).toBeLessThan(posUx === -1 ? Infinity : posUx);
  });

  it('las senales viejas pesan menos que las recientes', () => {
    const r = recomendar(ctx({
      senales: [senal('inscripcion', figma.id, 180), senal('inscripcion', sql.id, 1)],
      inscritos: new Set([figma.id, sql.id]),
    }));
    expect(CURSOS.find((c) => c.id === ids(r)[0])!.categoria).toBe('datos');
  });

  it('al terminar un curso sugiere el siguiente nivel de la misma categoria', () => {
    const r = recomendar(ctx({
      senales: [senal('inscripcion', python1.id), senal('curso_completado', python1.id)],
      inscritos: new Set([python1.id]),
    }));
    const python2Rec = r.recomendaciones.find((x) => x.cursoId === python2.id)!;
    expect(python2Rec.razon.tipo).toBe('siguiente_nivel');
    expect(ids(r)[0]).toBe(python2.id);
  });
});

describe('senal colaborativa', () => {
  it('recomienda lo que tomaron estudiantes con gustos parecidos aunque el tema no coincida', () => {
    // 20 estudiantes que tomaron Figma tambien tomaron Ventas; nadie relaciona Figma con Ingles.
    const grupo = new Set(Array.from({ length: 20 }, (_, i) => 1000 + i));
    const r = recomendar(ctx({
      senales: [senal('inscripcion', figma.id), senal('curso_completado', figma.id)],
      inscritos: new Set([figma.id]),
      inscritosPorCurso: new Map([[figma.id, grupo], [ventas.id, grupo], [ingles.id, new Set([5000, 5001])]]),
    }));
    expect(ids(r).indexOf(ventas.id)).toBeLessThan(ids(r).indexOf(ingles.id));
    expect(r.recomendaciones.find((x) => x.cursoId === ventas.id)!.razon.tipo).toBe('estudiantes_similares');
  });

  it('"porque viste" encuentra vecinos del curso', () => {
    const grupo = new Set([1, 2, 3, 4]);
    const v = similares(ctx({ inscritosPorCurso: new Map([[python1.id, grupo], [python2.id, grupo]]) }), python1.id);
    expect(v[0].cursoId).toBe(python2.id);
  });
});

describe('calidad de la lista', () => {
  it('con una sola inscripcion, el ruido colaborativo no gana a lo que el estudiante eligio', () => {
    // Caso real: eligio Datos + Programacion + Python y se inscribio en un curso de Python;
    // unos pocos estudiantes simulados tambien tomaron Figma (ruido).
    const pocos = new Set([1, 2, 3]);
    const r = recomendar(ctx({
      preferencia: { categorias: ['datos'], temas: ['Python'], nivel: null },
      senales: [senal('vista_curso', python1.id), senal('inscripcion', python1.id)],
      inscritos: new Set([python1.id]),
      inscritosPorCurso: new Map([[python1.id, new Set([1, 2, 3, 4, 5, 6, 7, 8])], [figma.id, pocos], [color.id, pocos]]),
    }), 4);
    const primeros = r.recomendaciones.slice(0, 2).map((x) => CURSOS.find((c) => c.id === x.cursoId)!.categoria);
    expect(primeros.every((c) => c === 'datos')).toBe(true);
  });

  it('no llena la lista con un solo tema (diversidad)', () => {
    const r = recomendar(ctx({ preferencia: { categorias: ['diseno', 'datos'], temas: [], nivel: null } }), 4);
    const categorias = new Set(r.recomendaciones.map((x) => CURSOS.find((c) => c.id === x.cursoId)!.categoria));
    expect(categorias.size).toBeGreaterThan(1);
  });

  it('cada recomendacion trae una explicacion legible', () => {
    const r = recomendar(ctx({ preferencia: { categorias: ['datos'], temas: ['python'], nivel: null } }));
    for (const x of r.recomendaciones) expect(x.razon.texto.length).toBeGreaterThan(5);
  });

  it('populares ordena por volumen y calidad', () => {
    expect(populares(ctx())[0].cursoId).toBe(ventas.id);
  });

  it('el resumen de intereses refleja lo aprendido', () => {
    const res = resumenIntereses(ctx({ senales: [senal('inscripcion', figma.id), senal('curso_completado', figma.id)] }));
    expect(res.intereses[0].intensidad).toBe(100);
    expect(res.intereses.map((i) => i.nombre)).toContain('diseno');
  });
});
