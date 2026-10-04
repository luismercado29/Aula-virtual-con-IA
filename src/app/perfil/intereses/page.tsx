import { desc, eq, gte, and } from 'drizzle-orm';
import { Brain, History, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { reiniciarRecomendacionesAccion } from '@/app/acciones/recomendaciones';
import { BotonEnviar } from '@/components/formulario';
import { Aviso } from '@/components/ui';
import { db, esquema as e } from '@/db';
import { contextoRecomendador } from '@/lib/consultas';
import { resumenIntereses } from '@/lib/recomendador/motor';
import { requerirUsuario } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Lo que la IA sabe de ti' };

const TEXTO_EVENTO: Record<string, string> = {
  vista_curso: 'Viste', clic_recomendacion: 'Abriste una recomendación:', inscripcion: 'Te inscribiste en',
  leccion_completada: 'Completaste una lección de', curso_completado: 'Terminaste', evaluacion: 'Presentaste la evaluación de',
  resena: 'Calificaste', busqueda: 'Buscaste', no_interesa: 'Marcaste «no me interesa» en', foro: 'Participaste en el foro de',
};
const ESTADO = {
  frio: { titulo: 'Aún no te conoce', texto: 'No elegiste intereses ni has explorado cursos. En cuanto abras uno, empezará a aprender.' },
  preferencias: { titulo: 'Partiendo de tus intereses', texto: 'Por ahora usa lo que elegiste en la bienvenida. Cuando estudies, aprenderá de lo que haces.' },
  aprendiendo: { titulo: 'Aprendiendo de lo que haces', texto: 'Tus recomendaciones se basan en lo que ves, terminas y calificas. Lo antiguo pesa menos con el tiempo.' },
};

export default async function Intereses({ searchParams }: { searchParams: Promise<{ reiniciado?: string }> }) {
  const usuario = await requerirUsuario('/perfil/intereses');
  const [{ reiniciado }, ctx] = await Promise.all([searchParams, contextoRecomendador(usuario.id)]);
  const resumen = resumenIntereses(ctx, 10);
  const recientes = await db.select({ tipo: e.eventos.tipo, texto: e.eventos.texto, valor: e.eventos.valor, creado: e.eventos.creado, curso: e.cursos.titulo })
    .from(e.eventos).leftJoin(e.cursos, eq(e.cursos.id, e.eventos.cursoId))
    .where(and(eq(e.eventos.usuarioId, usuario.id), gte(e.eventos.creado, new Date(Date.now() - 90 * 86_400_000))))
    .orderBy(desc(e.eventos.creado)).limit(15);
  const estado = ESTADO[resumen.estado];

  return (
    <div className="contenedor max-w-4xl py-10">
      <p className="etiqueta-chip"><Brain className="size-4" aria-hidden="true" />Transparencia</p>
      <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)] font-bold leading-tight tracking-[-0.035em]">Lo que la IA <span className="serif text-marca">sabe</span> de ti</h1>
      <p className="mt-3 text-lg text-tinta-2">Así entiende tus gustos el recomendador. Tú tienes el control: puedes cambiar tus intereses o empezar de cero.</p>
      {reiniciado && <div className="mt-6"><Aviso tono="exito">Listo: la IA olvidó tu historial de exploración. Tus cursos, notas y reseñas siguen intactos.</Aviso></div>}

      <section aria-labelledby="estado-ia" className="mt-8 rounded-3xl bg-noche p-8 text-white sobre-oscuro">
        <Sparkles className="size-7 text-[#FFD166]" aria-hidden="true" />
        <h2 id="estado-ia" className="mt-3 text-2xl font-bold">{estado.titulo}</h2>
        <p className="mt-2 text-white/80">{estado.texto}</p>
        <p className="mt-4 text-sm text-white/70">Señales que está usando: <strong className="text-white">{resumen.senalesPositivas}</strong></p>
      </section>

      <section aria-labelledby="intereses" className="mt-10">
        <h2 id="intereses" className="text-2xl font-bold">Tus intereses según la IA</h2>
        {resumen.intereses.length ? (
          <ul className="mt-5 space-y-4">
            {resumen.intereses.map((i) => (
              <li key={i.rasgo}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{i.nombre} <span className="text-sm font-normal text-tinta-2">({i.tipo === 'categoria' ? 'área' : 'tema'})</span></span>
                  <span className="text-sm text-tinta-2">{i.intensidad}%</span>
                </div>
                <div role="meter" aria-label={`Interés en ${i.nombre}`} aria-valuenow={i.intensidad} aria-valuemin={0} aria-valuemax={100}
                  className="mt-1.5 h-3 overflow-hidden rounded-full bg-borde">
                  <div className="h-full rounded-full bg-gradient-to-r from-marca to-[#8B6CFF]" style={{ width: `${i.intensidad}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-tinta-2">Todavía no hay intereses detectados.</p>}
        {resumen.nivelPreferido && <p className="mt-6">Nivel que más te encaja: <strong className="capitalize">{resumen.nivelPreferido}</strong></p>}
      </section>

      <section aria-labelledby="historial" className="mt-12">
        <h2 id="historial" className="flex items-center gap-2 text-2xl font-bold"><History className="size-6" aria-hidden="true" />Lo que ha observado (últimos 90 días)</h2>
        {recientes.length ? (
          <ul className="mt-5 divide-y divide-borde rounded-2xl border border-borde bg-superficie">
            {recientes.map((r, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                <span>{TEXTO_EVENTO[r.tipo]} <strong>{r.tipo === 'busqueda' ? `«${r.texto}»` : r.curso}</strong>{r.tipo === 'resena' && r.valor ? ` (${r.valor} estrellas)` : ''}{r.tipo === 'evaluacion' && r.valor != null ? ` (${r.valor}/100)` : ''}</span>
                <time dateTime={r.creado.toISOString()} className="text-sm text-tinta-2">{r.creado.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</time>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-tinta-2">Nada por ahora.</p>}
      </section>

      <section aria-labelledby="control" className="mt-12 grid gap-4 sm:grid-cols-2">
        <h2 id="control" className="sr-only">Controla tus recomendaciones</h2>
        <div className="tarjeta p-6">
          <SlidersHorizontal className="size-6 text-marca" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold">Cambiar mis intereses</h3>
          <p className="mt-1 text-tinta-2">Elige de nuevo áreas, temas y nivel.</p>
          <Link href="/bienvenida" className="boton boton-secundario mt-4">Editar intereses</Link>
        </div>
        <form action={reiniciarRecomendacionesAccion} className="tarjeta p-6">
          <RotateCcw className="size-6 text-error" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold">Empezar de cero</h3>
          <p className="mt-1 text-tinta-2">Olvida lo que exploraste, buscaste y descartaste. No borra tus cursos ni tus notas.</p>
          <BotonEnviar className="boton mt-4 bg-error-suave text-error hover:bg-error hover:text-white" pendiente="Reiniciando…">Reiniciar recomendaciones</BotonEnviar>
        </form>
      </section>

      <p className="mt-10 text-tinta-2"><Link href="/como-recomendamos" className="font-semibold text-marca underline underline-offset-4">¿Cómo funciona el recomendador?</Link></p>
    </div>
  );
}
