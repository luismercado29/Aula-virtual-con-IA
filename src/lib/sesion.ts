import 'server-only';

import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { db, esquema } from '@/db';
import type { Rol } from '@/db/esquema';

const COOKIE = 'aula_sesion';
const DURACION_S = 60 * 60 * 24 * 7; // una semana

function secreto() {
  const valor = process.env.AUTH_SECRET;
  if (!valor) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET no esta configurado: las sesiones no se pueden firmar.');
    }
    return new TextEncoder().encode('solo-para-desarrollo-local-no-usar-en-produccion');
  }
  return new TextEncoder().encode(valor);
}

export async function iniciarSesion(usuarioId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(usuarioId))
    .setIssuedAt()
    .setExpirationTime(`${DURACION_S}s`)
    .sign(secreto());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_S,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

async function idDeSesion(): Promise<number | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null; // firma invalida o vencida
  }
}

export type UsuarioSesion = Pick<
  typeof esquema.usuarios.$inferSelect,
  'id' | 'nombre' | 'email' | 'rol' | 'onboarding' | 'accesibilidad'
>;

/** Usuario de la peticion actual (una sola consulta por peticion gracias a cache()). */
export const usuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const id = await idDeSesion();
  if (id == null) return null;
  const u = await db.query.usuarios.findFirst({
    where: eq(esquema.usuarios.id, id),
    columns: { id: true, nombre: true, email: true, rol: true, onboarding: true, accesibilidad: true },
  });
  return u ?? null;
});

export async function requerirUsuario(siguiente?: string) {
  const u = await usuarioActual();
  if (!u) redirect(`/ingresar${siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : ''}`);
  return u;
}

export async function requerirRol(roles: Rol[], siguiente?: string) {
  const u = await requerirUsuario(siguiente);
  if (!roles.includes(u.rol)) redirect('/?aviso=sin-permiso');
  return u;
}

export const esDocente = (u: UsuarioSesion | null) => !!u && (u.rol === 'profesor' || u.rol === 'admin');

/** Solo acepta destinos internos (evita redirecciones abiertas tras el login). */
export function destinoSeguro(valor: unknown, porDefecto = '/') {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') ? valor : porDefecto;
}
