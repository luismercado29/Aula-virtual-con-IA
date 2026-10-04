'use client';

import { useActionState } from 'react';

import { actualizarPerfilAccion, cambiarClaveAccion, type EstadoFormulario } from '@/app/acciones/cuenta';
import { BotonEnviar, Campo, FocoEnError } from '@/components/formulario';

export function FormulariosPerfil({ nombre, titular, bio, docente }: { nombre: string; titular: string; bio: string; docente: boolean }) {
  const [p, accionPerfil] = useActionState<EstadoFormulario, FormData>(actualizarPerfilAccion, {});
  const [c, accionClave] = useActionState<EstadoFormulario, FormData>(cambiarClaveAccion, {});
  return (
    <div className="mt-8 space-y-8">
      <form action={accionPerfil} className="tarjeta space-y-5 p-6">
        <h2 className="text-xl font-bold">Datos personales</h2>
        <FocoEnError errores={p.errores} />
        <Campo nombre="nombre" etiqueta="Nombre" requerido valor={p.valores?.nombre ?? nombre} error={p.errores?.nombre} autoComplete="name" />
        {docente && <>
          <Campo nombre="titular" etiqueta="Titular profesional" valor={p.valores?.titular ?? titular} max={120} ayuda="Aparece en tus cursos, por ejemplo: «Diseñadora de producto»." />
          <Campo nombre="bio" etiqueta="Biografía" multilinea valor={p.valores?.bio ?? bio} max={600} />
        </>}
        <div className="flex items-center gap-4"><BotonEnviar pendiente="Guardando…">Guardar cambios</BotonEnviar><p role="status" className="font-semibold text-exito">{p.ok}</p></div>
      </form>
      <form action={accionClave} className="tarjeta space-y-5 p-6">
        <h2 className="text-xl font-bold">Cambiar contraseña</h2>
        <FocoEnError errores={c.errores} />
        <Campo nombre="actual" etiqueta="Contraseña actual" tipo="password" requerido autoComplete="current-password" error={c.errores?.actual} />
        <Campo nombre="nueva" etiqueta="Nueva contraseña" tipo="password" requerido autoComplete="new-password" error={c.errores?.nueva} ayuda="Mínimo 10 caracteres." />
        <div className="flex items-center gap-4"><BotonEnviar pendiente="Actualizando…">Actualizar contraseña</BotonEnviar><p role="status" className="font-semibold text-exito">{c.ok}</p></div>
      </form>
    </div>
  );
}
