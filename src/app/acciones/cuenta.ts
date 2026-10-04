'use server';

import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db, esquema } from '@/db';
import { bloqueado, limpiarIntentos, sumarIntento } from '@/lib/limites';
import { cerrarSesion, destinoSeguro, iniciarSesion, requerirUsuario } from '@/lib/sesion';

export type EstadoFormulario = { error?: string; errores?: Record<string, string>; ok?: string; valores?: Record<string, string> };

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre (mínimo 2 letras).').max(80),
  email: z.string().trim().toLowerCase().email('Escribe un correo válido, por ejemplo ana@correo.com.'),
  clave: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres.').max(200),
  rol: z.enum(['estudiante', 'profesor']).default('estudiante'),
});

function erroresDeCampo(error: z.ZodError) {
  const errores: Record<string, string> = {};
  for (const i of error.issues) errores[String(i.path[0])] ??= i.message;
  return errores;
}

async function ipCliente() {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
}

export async function registrarAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const valores = { nombre: String(datos.get('nombre') ?? ''), email: String(datos.get('email') ?? ''), rol: String(datos.get('rol') ?? 'estudiante') };
  const r = esquemaRegistro.safeParse({ ...valores, clave: datos.get('clave') });
  if (!r.success) return { errores: erroresDeCampo(r.error), valores };

  const existe = await db.query.usuarios.findFirst({ where: eq(sql`lower(${esquema.usuarios.email})`, r.data.email), columns: { id: true } });
  if (existe) return { errores: { email: 'Ya existe una cuenta con ese correo. ¿Quieres ingresar?' }, valores };

  const [usuario] = await db.insert(esquema.usuarios).values({
    nombre: r.data.nombre, email: r.data.email, hashClave: await bcrypt.hash(r.data.clave, 12), rol: r.data.rol,
    onboarding: r.data.rol === 'profesor' ? 'omitido' : 'pendiente',
  }).returning({ id: esquema.usuarios.id });
  await iniciarSesion(usuario.id);
  // Lo primero que ve un estudiante nuevo es la bienvenida: ahi elige sus intereses (o lo omite).
  redirect(r.data.rol === 'profesor' ? '/docencia' : '/bienvenida');
}

export async function ingresarAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const email = String(datos.get('email') ?? '').trim().toLowerCase();
  const clave = String(datos.get('clave') ?? '');
  const valores = { email };
  const claves = [`ip:${await ipCliente()}`, `email:${email}`];
  if (bloqueado(claves[0], 20) || bloqueado(claves[1], 5)) {
    return { error: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.', valores };
  }
  const usuario = email
    ? await db.query.usuarios.findFirst({ where: eq(sql`lower(${esquema.usuarios.email})`, email) })
    : undefined;
  // Se compara aunque el usuario no exista, para no revelar por el tiempo de respuesta si la cuenta existe.
  const valida = await bcrypt.compare(clave, usuario?.hashClave ?? '$2b$12$5fhMcIe/kIPiYSMKjXPWYurgJMRwTLnoez.ESD0Kpad61tZ6bRJR6');
  if (!usuario || !valida) {
    claves.forEach((c) => sumarIntento(c));
    return { error: 'Correo o contraseña incorrectos.', valores };
  }
  limpiarIntentos(claves[1]);
  await iniciarSesion(usuario.id);
  redirect(usuario.onboarding === 'pendiente' && usuario.rol === 'estudiante'
    ? '/bienvenida' : destinoSeguro(datos.get('siguiente')));
}

export async function cerrarSesionAccion() {
  await cerrarSesion();
  redirect('/');
}

const esquemaPerfil = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(80),
  titular: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(600).optional(),
});

export async function actualizarPerfilAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario('/perfil');
  const valores = { nombre: String(datos.get('nombre') ?? ''), titular: String(datos.get('titular') ?? ''), bio: String(datos.get('bio') ?? '') };
  const r = esquemaPerfil.safeParse(valores);
  if (!r.success) return { errores: erroresDeCampo(r.error), valores };
  await db.update(esquema.usuarios).set({ nombre: r.data.nombre, titular: r.data.titular || null, bio: r.data.bio || null })
    .where(eq(esquema.usuarios.id, usuario.id));
  return { ok: 'Perfil actualizado.', valores };
}

export async function cambiarClaveAccion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const sesion = await requerirUsuario('/perfil');
  const actual = String(datos.get('actual') ?? '');
  const nueva = String(datos.get('nueva') ?? '');
  if (nueva.length < 10) return { errores: { nueva: 'La nueva contraseña debe tener al menos 10 caracteres.' } };
  const u = await db.query.usuarios.findFirst({ where: eq(esquema.usuarios.id, sesion.id) });
  if (!u || !(await bcrypt.compare(actual, u.hashClave))) return { errores: { actual: 'La contraseña actual no es correcta.' } };
  await db.update(esquema.usuarios).set({ hashClave: await bcrypt.hash(nueva, 12) }).where(eq(esquema.usuarios.id, u.id));
  return { ok: 'Contraseña actualizada.' };
}
