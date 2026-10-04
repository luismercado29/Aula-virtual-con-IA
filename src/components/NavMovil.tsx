'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { Logo } from './Logo';

export function NavMovil({ enlaces, usuario }: { enlaces: { href: string; texto: string }[]; usuario: boolean }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrar = () => dialogo.current?.close();
  return (
    <>
      <button type="button" className="boton boton-fantasma px-2 lg:hidden" aria-label="Abrir menú" aria-haspopup="dialog"
        onClick={() => dialogo.current?.showModal()}>
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <dialog ref={dialogo} aria-label="Menú principal"
        className="m-0 h-dvh max-h-none w-[min(22rem,100vw)] bg-superficie p-0 text-tinta backdrop:bg-noche/60"
        onClick={(ev) => { if (ev.target === dialogo.current) cerrar(); }}>
        <div className="flex h-[4.25rem] items-center justify-between border-b border-borde px-4">
          <Logo />
          <button type="button" className="boton boton-fantasma px-2" onClick={cerrar} aria-label="Cerrar menú">
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Principal (móvil)" className="p-4">
          <ul className="space-y-1 text-lg">
            <li><Link href="/" onClick={cerrar} className="flex min-h-12 items-center rounded-xl px-3 hover:bg-marca-suave">Inicio</Link></li>
            {enlaces.map((e) => (
              <li key={e.href}><Link href={e.href} onClick={cerrar} className="flex min-h-12 items-center rounded-xl px-3 hover:bg-marca-suave">{e.texto}</Link></li>
            ))}
            {!usuario && <li><Link href="/ingresar" onClick={cerrar} className="flex min-h-12 items-center rounded-xl px-3 hover:bg-marca-suave">Ingresar</Link></li>}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
