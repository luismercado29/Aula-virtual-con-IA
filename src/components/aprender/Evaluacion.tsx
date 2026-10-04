'use client';

import { CircleCheck, CircleX, RotateCcw } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';

import { evaluarAccion, type ResultadoEvaluacion } from '@/app/acciones/aprendizaje';
import { BotonEnviar } from '@/components/formulario';

type Pregunta = { id: number; enunciado: string; opciones: string[] };

/**
 * Evaluacion accesible: cada pregunta es un fieldset con su legend; el
 * resultado se anuncia (role="status") y el foco va al resumen. Correcto e
 * incorrecto se indican con texto e icono, nunca solo con color.
 */
export function Evaluacion({ leccionId, preguntas, mejorNota }: { leccionId: number; preguntas: Pregunta[]; mejorNota: number | null }) {
  const [r, accion] = useActionState<ResultadoEvaluacion, FormData>(evaluarAccion, {});
  const resumen = useRef<HTMLDivElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => { if (r.puntaje != null || r.error) resumen.current?.focus(); }, [r]);
  const porPregunta = new Map(r.detalle?.map((d) => [d.preguntaId, d]));

  return (
    <form ref={formulario} action={accion} className="space-y-8">
      <input type="hidden" name="leccionId" value={leccionId} />
      {mejorNota != null && r.puntaje == null && (
        <p className="rounded-xl bg-marca-suave px-4 py-3">Tu mejor nota hasta ahora: <strong>{mejorNota}/100</strong>. Puedes volver a intentarlo.</p>
      )}

      <div ref={resumen} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
        {r.error && <p className="rounded-xl bg-error-suave px-4 py-3 font-semibold text-error">{r.error}</p>}
        {r.puntaje != null && (
          <div className={`rounded-2xl p-6 ${r.aprobada ? 'bg-exito-suave' : 'bg-aviso-suave'}`}>
            <p className="text-sm font-semibold uppercase tracking-wider text-tinta-2">Resultado</p>
            <p className="mt-1 text-4xl font-bold">{r.puntaje}<span className="text-xl text-tinta-2">/100</span></p>
            <p className="mt-2 text-lg font-semibold">
              {r.aprobada ? '¡Aprobaste! La lección quedó completada.' : 'Aún no alcanzas 70. Revisa las explicaciones y vuelve a intentarlo.'}
            </p>
          </div>
        )}
      </div>

      {preguntas.map((p, i) => {
        const d = porPregunta.get(p.id);
        return (
          <fieldset key={p.id} className="tarjeta p-6" aria-describedby={d ? `fb-${p.id}` : undefined}>
            <legend className="float-left w-full text-lg font-bold">
              <span className="text-tinta-2">Pregunta {i + 1} de {preguntas.length}. </span>{p.enunciado}
            </legend>
            <div className="clear-both space-y-2 pt-4">
              {p.opciones.map((o, j) => {
                const esCorrecta = d && j === d.correctaIndice;
                const esElegidaMal = d && j === d.elegida && !d.correcta;
                return (
                  <label key={j} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2 transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-marca
                    ${esCorrecta ? 'border-exito bg-exito-suave' : esElegidaMal ? 'border-error bg-error-suave' : 'border-borde has-[:checked]:border-marca has-[:checked]:bg-marca-suave hover:border-borde-fuerte'}`}>
                    <input type="radio" name={`p${p.id}`} value={j} required defaultChecked={d?.elegida === j} className="size-5 shrink-0 accent-marca" />
                    <span className="flex-1">{o}</span>
                    {esCorrecta && <span className="flex items-center gap-1 font-semibold text-exito"><CircleCheck className="size-5" aria-hidden="true" />Correcta</span>}
                    {esElegidaMal && <span className="flex items-center gap-1 font-semibold text-error"><CircleX className="size-5" aria-hidden="true" />Tu respuesta</span>}
                  </label>
                );
              })}
            </div>
            {d && (
              <p id={`fb-${p.id}`} className="mt-4 rounded-xl bg-papel px-4 py-3">
                <strong>{d.correcta ? 'Correcto. ' : 'Incorrecto. '}</strong>{d.explicacion}
              </p>
            )}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap gap-3">
        <BotonEnviar className="boton boton-primario h-12 px-7" pendiente="Calificando…">{r.puntaje != null ? 'Enviar de nuevo' : 'Enviar respuestas'}</BotonEnviar>
        {r.puntaje != null && (
          <button type="button" className="boton boton-secundario h-12" onClick={() => { formulario.current?.reset(); window.location.reload(); }}>
            <RotateCcw className="size-4" aria-hidden="true" />Empezar de nuevo
          </button>
        )}
      </div>
    </form>
  );
}
