import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { db, esquema } from '@/db';
import { requerirUsuario } from '@/lib/sesion';

import { FormulariosPerfil } from './FormulariosPerfil';

export const metadata: Metadata = { title: 'Mi perfil' };

export default async function Perfil() {
  const sesion = await requerirUsuario('/perfil');
  const u = await db.query.usuarios.findFirst({ where: eq(esquema.usuarios.id, sesion.id), columns: { nombre: true, email: true, titular: true, bio: true, rol: true } });
  return (
    <div className="contenedor max-w-3xl py-10">
      <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-bold tracking-[-0.035em]">Mi <span className="serif text-marca">perfil</span></h1>
      <p className="mt-2 text-tinta-2">{u?.email} · {u?.rol === 'profesor' ? 'Profesor' : u?.rol === 'admin' ? 'Administración' : 'Estudiante'}</p>
      <FormulariosPerfil nombre={u?.nombre ?? ''} titular={u?.titular ?? ''} bio={u?.bio ?? ''} docente={u?.rol !== 'estudiante'} />
    </div>
  );
}
