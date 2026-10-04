import { Search } from 'lucide-react';
import Link from 'next/link';

import type { PreferenciasAccesibilidad } from '@/db/esquema';
import type { UsuarioSesion } from '@/lib/sesion';

import { Logo } from './Logo';
import { MenuUsuario } from './MenuUsuario';
import { NavMovil } from './NavMovil';
import { PanelAccesibilidad } from './PanelAccesibilidad';

export function Cabecera({ usuario, preferencias }: { usuario: UsuarioSesion | null; preferencias: PreferenciasAccesibilidad }) {
  const docente = usuario && (usuario.rol === 'profesor' || usuario.rol === 'admin');
  const enlaces = [
    { href: '/explorar', texto: 'Explorar' },
    ...(usuario ? [{ href: '/mi-aprendizaje', texto: 'Mi aprendizaje' }] : []),
    ...(docente ? [{ href: '/docencia', texto: 'Docencia' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-papel/90 backdrop-blur-md">
      <div className="contenedor flex h-[4.25rem] items-center gap-1 sm:gap-3">
        <NavMovil enlaces={enlaces} usuario={!!usuario} />
        <Link href="/" className="shrink-0 rounded-lg" aria-label="Aula IA, inicio">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="ml-4 hidden lg:block">
          <ul className="flex items-center gap-1">
            {enlaces.map((e) => (
              <li key={e.href}><Link href={e.href} className="boton boton-fantasma px-3 text-[0.95rem]">{e.texto}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-full max-w-md md:block lg:ml-6">
          <form action="/explorar" role="search" className="relative">
            <label htmlFor="busqueda-global" className="sr-only">Buscar cursos, temas o profesores</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tinta-3" aria-hidden="true" />
            <input id="busqueda-global" name="q" type="search" placeholder="¿Qué quieres aprender hoy?"
              className="campo min-h-11 rounded-full pl-11" autoComplete="off" />
          </form>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 md:ml-2">
          <Link href="/explorar" className="boton boton-fantasma px-2.5 md:hidden" aria-label="Buscar cursos">
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <PanelAccesibilidad inicial={preferencias} />
          {usuario ? (
            <MenuUsuario nombre={usuario.nombre} rol={usuario.rol} />
          ) : (
            <>
              <Link href="/ingresar" className="boton boton-fantasma hidden sm:inline-flex">Ingresar</Link>
              <Link href="/registro" className="boton boton-primario max-sm:px-3.5 max-sm:text-[0.9rem]"><span>Únete<span className="max-sm:sr-only"> gratis</span></span></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
