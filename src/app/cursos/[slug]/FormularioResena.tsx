'use client';

import { Star } from 'lucide-react';
import { useActionState, useState } from 'react';

import { resenarAccion } from '@/app/acciones/aprendizaje';
import type { EstadoFormulario } from '@/app/acciones/cuenta';
import { BotonEnviar, Campo } from '@/components/formulario';

const TEXTOS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

/** Calificacion con estrellas como grupo de radios: funciona con flechas del teclado y lector de pantalla. */
export function FormularioResena({ cursoId, actual }: { cursoId: number; actual?: { calificacion: number; comentario: string } }) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(resenarAccion, {});
  const [valor, setValor] = useState(actual?.calificacion ?? 0);
  const [encima, setEncima] = useState(0);
  const mostrado = encima || valor;
  return (
    <form action={accion} className="tarjeta space-y-4 p-5">
      <input type="hidden" name="cursoId" value={cursoId} />
      <fieldset>
        <legend className="font-bold">{actual ? 'Tu reseña' : '¿Qué te pareció el curso?'}</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setEncima(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-marca" onMouseEnter={() => setEncima(n)}>
              <input type="radio" name="calificacion" value={n} checked={valor === n} onChange={() => setValor(n)} className="sr-only" />
              <Star aria-hidden="true" className={`size-8 ${mostrado >= n ? 'fill-estrella text-estrella' : 'text-borde-fuerte'}`} />
              <span className="sr-only">{n} de 5: {TEXTOS[n]}</span>
            </label>
          ))}
          <span className="ml-2 font-semibold text-tinta-2" aria-hidden="true">{TEXTOS[mostrado]}</span>
        </div>
        {estado.errores?.calificacion && <p className="mt-1 text-sm font-semibold text-error">{estado.errores.calificacion}</p>}
      </fieldset>
      <Campo nombre="comentario" etiqueta="Comentario (opcional)" multilinea filas={3} valor={actual?.comentario} max={1000} error={estado.errores?.comentario} />
      <div className="flex flex-wrap items-center gap-4">
        <BotonEnviar pendiente="Publicando…">{actual ? 'Actualizar reseña' : 'Publicar reseña'}</BotonEnviar>
        <p role="status" className="font-semibold text-exito">{estado.ok}</p>
        {estado.error && <p role="alert" className="font-semibold text-error">{estado.error}</p>}
      </div>
    </form>
  );
}
