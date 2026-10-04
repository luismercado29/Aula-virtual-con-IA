import { Search, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { TarjetaCurso } from '@/components/TarjetaCurso';
import { buscarCursos, categoriasConConteo, type FiltrosCatalogo } from '@/lib/consultas';
import { registrarEvento } from '@/lib/eventos';
import { usuarioActual } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Explorar cursos' };

const ORDENES = [['populares', 'Más populares'], ['mejor', 'Mejor calificados'], ['nuevos', 'Más recientes'], ['relevancia', 'Relevancia']] as const;

export default async function Explorar({ searchParams }: { searchParams: Promise<FiltrosCatalogo> }) {
  const f = await searchParams;
  const [cursos, categorias, usuario] = await Promise.all([buscarCursos(f), categoriasConConteo(), usuarioActual()]);
  // Lo que busca tambien ensena a la IA sobre sus intereses.
  if (usuario && f.q?.trim()) await registrarEvento(usuario.id, 'busqueda', { texto: f.q.trim() });

  const categoriaActual = categorias.find((c) => c.slug === f.categoria);
  const hayFiltros = !!(f.q || f.categoria || f.nivel || f.duracion || f.calificacion);
  const select = 'campo min-h-11 cursor-pointer';

  return (
    <div className="contenedor py-10">
      <header>
        <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.035em]">
          {f.q ? <>Resultados para <span className="serif text-marca">«{f.q}»</span></> : categoriaActual ? <span className="serif">{categoriaActual.nombre}</span> : <>Explora el <span className="serif text-marca">catálogo</span></>}
        </h1>
        {categoriaActual && <p className="mt-2 text-lg text-tinta-2">{categoriaActual.descripcion}</p>}
      </header>

      <nav aria-label="Categorías" className="mt-8 -mx-1 overflow-x-auto pb-2">
        <ul className="flex gap-2 px-1">
          <li><Link href="/explorar" aria-current={!f.categoria ? 'page' : undefined} className={`boton ${!f.categoria ? 'boton-primario' : 'boton-secundario'} min-h-10`}>Todas</Link></li>
          {categorias.map((c) => (
            <li key={c.slug}>
              <Link href={`/explorar?categoria=${c.slug}`} aria-current={f.categoria === c.slug ? 'page' : undefined}
                className={`boton ${f.categoria === c.slug ? 'boton-primario' : 'boton-secundario'} min-h-10`}>
                {c.nombre} <span className="text-sm opacity-75">({c.cursos})</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside aria-labelledby="filtros-titulo">
          <form method="get" className="tarjeta space-y-5 p-5 lg:sticky lg:top-24" role="search" aria-labelledby="filtros-titulo">
            <h2 id="filtros-titulo" className="flex items-center gap-2 text-lg font-bold"><SlidersHorizontal className="size-5" aria-hidden="true" />Filtrar</h2>
            <div className="space-y-1.5">
              <label htmlFor="f-q" className="font-semibold">Palabras clave</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-3" aria-hidden="true" />
                <input id="f-q" name="q" type="search" defaultValue={f.q} className="campo min-h-11 pl-9" placeholder="Python, diseño…" />
              </div>
            </div>
            {f.categoria && <input type="hidden" name="categoria" value={f.categoria} />}
            <div className="space-y-1.5">
              <label htmlFor="f-nivel" className="font-semibold">Nivel</label>
              <select id="f-nivel" name="nivel" defaultValue={f.nivel ?? ''} className={select}>
                <option value="">Cualquiera</option><option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f-dur" className="font-semibold">Duración</label>
              <select id="f-dur" name="duracion" defaultValue={f.duracion ?? ''} className={select}>
                <option value="">Cualquiera</option><option value="corto">Hasta 2 horas</option>
                <option value="medio">2 a 6 horas</option><option value="largo">Más de 6 horas</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f-cal" className="font-semibold">Calificación</label>
              <select id="f-cal" name="calificacion" defaultValue={f.calificacion ?? ''} className={select}>
                <option value="">Cualquiera</option><option value="4.5">4,5 o más</option><option value="4">4 o más</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="f-orden" className="font-semibold">Ordenar por</label>
              <select id="f-orden" name="orden" defaultValue={f.orden ?? (f.q ? 'relevancia' : 'populares')} className={select}>
                {ORDENES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className="boton boton-primario w-full">Aplicar filtros</button>
            {hayFiltros && <Link href="/explorar" className="boton boton-fantasma w-full">Quitar filtros</Link>}
          </form>
        </aside>

        <section aria-labelledby="resultados-titulo">
          <h2 id="resultados-titulo" className="sr-only">Resultados</h2>
          <p role="status" className="mb-5 font-semibold text-tinta-2">{cursos.length === 1 ? '1 curso' : `${cursos.length} cursos`}</p>
          {cursos.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {cursos.map((c) => <li key={c.id}><TarjetaCurso curso={c} encabezado="h3" /></li>)}
            </ul>
          ) : (
            <div className="tarjeta p-10 text-center">
              <h3 className="text-xl font-bold">No encontramos cursos con esos filtros</h3>
              <p className="mt-2 text-tinta-2">Prueba con otras palabras o quita algún filtro.</p>
              <Link href="/explorar" className="boton boton-primario mt-6">Ver todo el catálogo</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
