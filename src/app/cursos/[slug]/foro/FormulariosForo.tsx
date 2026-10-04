'use client';

import { useActionState, useEffect, useRef } from 'react';

import type { EstadoFormulario } from '@/app/acciones/cuenta';
import { crearHiloAccion, responderAccion } from '@/app/acciones/foro';
import { BotonEnviar, Campo, FocoEnError } from '@/components/formulario';

export function NuevoHilo({ cursoId, leccionId }: { cursoId: number; leccionId?: number }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(crearHiloAccion, {});
  return (
    <form action={accion} className="tarjeta space-y-4 p-6">
      <h2 className="text-xl font-bold">Haz una pregunta</h2>
      <FocoEnError errores={estado.errores ?? estado.error} />
      {estado.error && <p role="alert" tabIndex={-1} className="rounded-xl bg-error-suave px-4 py-3 font-semibold text-error">{estado.error}</p>}
      <input type="hidden" name="cursoId" value={cursoId} />
      {leccionId && <input type="hidden" name="leccionId" value={leccionId} />}
      <Campo nombre="titulo" etiqueta="Título" requerido max={140} error={estado.errores?.titulo} valor={estado.valores?.titulo}
        ayuda="Resume tu duda en una frase, por ejemplo: «¿Cuándo usar un ciclo while?»" />
      <Campo nombre="cuerpo" etiqueta="Detalle" multilinea filas={5} requerido max={5000} error={estado.errores?.cuerpo} valor={estado.valores?.cuerpo} />
      <BotonEnviar pendiente="Publicando…">Publicar pregunta</BotonEnviar>
    </form>
  );
}

export function Responder({ hiloId }: { hiloId: number }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(responderAccion, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado]);
  return (
    <form ref={form} action={accion} className="tarjeta space-y-4 p-6">
      <input type="hidden" name="hiloId" value={hiloId} />
      <Campo nombre="cuerpo" etiqueta="Tu respuesta" multilinea filas={4} requerido max={5000} error={estado.errores?.cuerpo} valor={estado.valores?.cuerpo} />
      <div className="flex flex-wrap items-center gap-4">
        <BotonEnviar pendiente="Publicando…">Responder</BotonEnviar>
        <p role="status" className="font-semibold text-exito">{estado.ok}</p>
        {estado.error && <p role="alert" className="font-semibold text-error">{estado.error}</p>}
      </div>
    </form>
  );
}
