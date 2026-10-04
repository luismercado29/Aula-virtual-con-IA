'use client';

import { Accessibility, Brain, ChevronDown, GraduationCap, LogOut, Presentation, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { cerrarSesionAccion } from '@/app/acciones/cuenta';

/** Menu desplegable accesible: boton con aria-expanded, Escape cierra y devuelve el foco. */
export function MenuUsuario({ nombre, rol }: { nombre: string; rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const id = useId();
  const iniciales = nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    if (!abierto) return;
    const primero = contenedor.current?.querySelector<HTMLElement>('a, button');
    primero?.focus();
    const alPulsar = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { setAbierto(false); boton.current?.focus(); } };
    const alClic = (ev: MouseEvent) => { if (!contenedor.current?.contains(ev.target as Node) && ev.target !== boton.current) setAbierto(false); };
    document.addEventListener('keydown', alPulsar);
    document.addEventListener('mousedown', alClic);
    return () => { document.removeEventListener('keydown', alPulsar); document.removeEventListener('mousedown', alClic); };
  }, [abierto]);

  const enlace = 'flex min-h-11 items-center gap-3 rounded-lg px-3 text-tinta hover:bg-marca-suave';
  return (
    <div className="relative">
      <button ref={boton} type="button" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((v) => !v)}
        className="boton boton-fantasma gap-2 px-2">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-tinta text-sm font-bold text-white">{iniciales}</span>
        <span className="sr-only">Menú de {nombre}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
      <div ref={contenedor} id={id} hidden={!abierto}
        className="tarjeta absolute right-0 top-full mt-2 w-64 p-2 shadow-elevada">
        <p className="px-3 pb-2 pt-1 text-sm text-tinta-2">Sesión iniciada como <strong className="block text-tinta">{nombre}</strong></p>
        <ul className="border-t border-borde pt-2">
          <li><Link href="/mi-aprendizaje" className={enlace} onClick={() => setAbierto(false)}><GraduationCap className="size-5" aria-hidden="true" />Mi aprendizaje</Link></li>
          <li><Link href="/perfil/intereses" className={enlace} onClick={() => setAbierto(false)}><Brain className="size-5" aria-hidden="true" />Lo que la IA sabe de mí</Link></li>
          {(rol === 'profesor' || rol === 'admin') && (
            <li><Link href="/docencia" className={enlace} onClick={() => setAbierto(false)}><Presentation className="size-5" aria-hidden="true" />Panel de docencia</Link></li>
          )}
          <li><Link href="/perfil" className={enlace} onClick={() => setAbierto(false)}><User className="size-5" aria-hidden="true" />Mi perfil</Link></li>
          <li><Link href="/accesibilidad" className={enlace} onClick={() => setAbierto(false)}><Accessibility className="size-5" aria-hidden="true" />Accesibilidad</Link></li>
        </ul>
        <form action={cerrarSesionAccion} className="mt-2 border-t border-borde pt-2">
          <button type="submit" className={`${enlace} w-full text-error`}><LogOut className="size-5" aria-hidden="true" />Cerrar sesión</button>
        </form>
      </div>
    </div>
  );
}
