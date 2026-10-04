import { asc, ne } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';

import { cambiarRolAccion } from '@/app/acciones/docencia';
import { db, esquema as e } from '@/db';
import { requerirRol } from '@/lib/sesion';

import { Mensajes } from '../Mensajes';

export const metadata: Metadata = { title: 'Usuarios y roles' };

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; q?: string }> }) {
  const admin = await requerirRol(['admin'], '/docencia/usuarios');
  const msg = await searchParams;
  const q = msg.q?.trim().toLowerCase();
  let usuarios = await db.select({ id: e.usuarios.id, nombre: e.usuarios.nombre, email: e.usuarios.email, rol: e.usuarios.rol })
    .from(e.usuarios).where(ne(e.usuarios.id, admin.id)).orderBy(asc(e.usuarios.nombre));
  if (q) usuarios = usuarios.filter((u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  return (
    <div className="contenedor max-w-4xl py-10">
      <Link href="/docencia" className="text-sm font-semibold text-marca hover:underline">← Panel de docencia</Link>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Usuarios y roles</h1>
      <div className="mt-6"><Mensajes ok={msg.ok} error={msg.error} /></div>
      <form method="get" role="search" className="mt-6 flex gap-2">
        <label htmlFor="buscar-usuario" className="sr-only">Buscar por nombre o correo</label>
        <input id="buscar-usuario" name="q" defaultValue={msg.q} className="campo" placeholder="Buscar por nombre o correo" />
        <button type="submit" className="boton boton-secundario">Buscar</button>
      </form>
      <ul className="mt-6 divide-y divide-borde rounded-2xl border border-borde bg-superficie">
        {usuarios.slice(0, 100).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
            <div className="min-w-0 flex-1"><p className="font-semibold">{u.nombre}</p><p className="truncate text-sm text-tinta-2">{u.email}</p></div>
            <form action={cambiarRolAccion} className="flex items-center gap-2">
              <input type="hidden" name="usuarioId" value={u.id} />
              <label htmlFor={`rol-${u.id}`} className="sr-only">Rol de {u.nombre}</label>
              <select id={`rol-${u.id}`} name="rol" defaultValue={u.rol} className="campo min-h-11 w-40"><option value="estudiante">Estudiante</option><option value="profesor">Profesor</option><option value="admin">Administración</option></select>
              <button type="submit" className="boton boton-secundario">Guardar<span className="sr-only"> rol de {u.nombre}</span></button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
