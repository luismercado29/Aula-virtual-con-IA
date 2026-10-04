'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { ingresarAccion, registrarAccion, type EstadoFormulario } from '@/app/acciones/cuenta';
import { BotonEnviar, Campo, FocoEnError } from '@/components/formulario';

export function FormularioIngreso({ siguiente }: { siguiente?: string }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(ingresarAccion, {});
  return (
    <form action={accion} className="space-y-5" noValidate>
      <FocoEnError errores={estado.error} />
      {estado.error && <p role="alert" tabIndex={-1} className="rounded-xl bg-error-suave px-4 py-3 font-semibold text-error">{estado.error}</p>}
      <input type="hidden" name="siguiente" value={siguiente ?? '/'} />
      <Campo nombre="email" etiqueta="Correo electrónico" tipo="email" autoComplete="email" requerido valor={estado.valores?.email} />
      <Campo nombre="clave" etiqueta="Contraseña" tipo="password" autoComplete="current-password" requerido />
      <BotonEnviar className="boton boton-primario w-full h-12" pendiente="Ingresando…">Ingresar</BotonEnviar>
      <p className="text-center text-tinta-2">¿Aún no tienes cuenta? <Link href="/registro" className="font-semibold text-marca underline underline-offset-4">Créala gratis</Link></p>
    </form>
  );
}

export function FormularioRegistro({ rolInicial }: { rolInicial: 'estudiante' | 'profesor' }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarAccion, {});
  const e = estado.errores ?? {};
  const rol = estado.valores?.rol ?? rolInicial;
  return (
    <form action={accion} className="space-y-5" noValidate>
      <FocoEnError errores={estado.errores} />
      {estado.errores && <p role="alert" className="rounded-xl bg-error-suave px-4 py-3 font-semibold text-error">Revisa los campos marcados.</p>}
      <fieldset>
        <legend className="font-semibold">Quiero…</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[['estudiante', 'Aprender'], ['profesor', 'Enseñar']].map(([valor, texto]) => (
            <label key={valor} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-borde px-4 has-[:checked]:border-marca has-[:checked]:bg-marca-suave has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-marca">
              <input type="radio" name="rol" value={valor} defaultChecked={rol === valor} className="size-5 accent-marca" />
              <span className="font-semibold">{texto}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Campo nombre="nombre" etiqueta="Nombre completo" autoComplete="name" requerido error={e.nombre} valor={estado.valores?.nombre} />
      <Campo nombre="email" etiqueta="Correo electrónico" tipo="email" autoComplete="email" requerido error={e.email} valor={estado.valores?.email} />
      <Campo nombre="clave" etiqueta="Contraseña" tipo="password" autoComplete="new-password" requerido error={e.clave}
        ayuda="Mínimo 10 caracteres. Una frase fácil de recordar es más segura que una palabra corta." />
      <BotonEnviar className="boton boton-primario w-full h-12" pendiente="Creando tu cuenta…">Crear cuenta</BotonEnviar>
      <p className="text-center text-tinta-2">¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-marca underline underline-offset-4">Ingresa</Link></p>
    </form>
  );
}
