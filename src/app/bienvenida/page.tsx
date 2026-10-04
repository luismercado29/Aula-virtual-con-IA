import { Check, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

import { guardarPreferenciasAccion, omitirBienvenidaAccion } from '@/app/acciones/recomendaciones';
import { BotonEnviar } from '@/components/formulario';
import { IconoCategoria } from '@/components/Iconos';
import { db, esquema } from '@/db';
import { categoriasConConteo, cursosPublicados } from '@/lib/consultas';
import { requerirUsuario } from '@/lib/sesion';
import { eq } from 'drizzle-orm';

export const metadata: Metadata = { title: 'Bienvenida' };

export default async function Bienvenida({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const usuario = await requerirUsuario('/bienvenida');
  const [categorias, cursos, actual, { error }] = await Promise.all([
    categoriasConConteo(), cursosPublicados(),
    db.query.preferencias.findFirst({ where: eq(esquema.preferencias.usuarioId, usuario.id) }),
    searchParams,
  ]);
  // Temas mas frecuentes del catalogo: opciones concretas, no un campo de texto libre.
  const conteo = new Map<string, number>();
  for (const c of cursos) for (const t of c.etiquetas) conteo.set(t, (conteo.get(t) ?? 0) + 1);
  const temas = [...conteo].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([t]) => t);

  const tarjetaOpcion = 'relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-borde bg-superficie p-4 transition has-[:checked]:border-marca has-[:checked]:bg-marca-suave has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-marca hover:border-borde-fuerte';

  return (
    <div className="contenedor max-w-4xl py-12">
      <p className="etiqueta-chip"><Sparkles className="size-4" aria-hidden="true" />Paso único · menos de un minuto</p>
      <h1 className="mt-5 text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.035em]">
        Hola, {usuario.nombre.split(' ')[0]}. ¿Qué te gustaría <span className="serif text-marca">aprender</span>?
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-tinta-2">
        Con esto la IA prepara tus primeras recomendaciones. Todo es opcional: si prefieres no elegir nada, esperará a ver qué cursos exploras.
      </p>
      {error && <p role="alert" className="mt-6 rounded-xl bg-error-suave px-4 py-3 font-semibold text-error">No pudimos guardar tus intereses. Inténtalo de nuevo.</p>}

      <form action={guardarPreferenciasAccion} className="mt-10 space-y-12">
        <fieldset>
          <legend className="text-2xl font-bold">1. Áreas que te interesan</legend>
          <p className="mt-1 text-tinta-2">Elige todas las que quieras.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categorias.map((c) => (
              <label key={c.slug} className={tarjetaOpcion}>
                <input type="checkbox" name="categorias" value={c.slug} defaultChecked={actual?.categorias.includes(c.slug)} className="peer sr-only" />
                <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: c.color }}>
                  <IconoCategoria nombre={c.icono} className="size-5" />
                </span>
                <span className="font-semibold leading-tight">{c.nombre}</span>
                <Check aria-hidden="true" className="absolute right-3 top-3 hidden size-5 text-marca peer-checked:block" />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-2xl font-bold">2. Temas concretos</legend>
          <p className="mt-1 text-tinta-2">Opcional. Ayuda a afinar desde el primer día.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {temas.map((t) => (
              <label key={t} className="cursor-pointer rounded-full border-2 border-borde bg-superficie px-4 py-2 font-medium transition has-[:checked]:border-marca has-[:checked]:bg-marca has-[:checked]:text-white has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-marca hover:border-borde-fuerte">
                <input type="checkbox" name="temas" value={t} defaultChecked={actual?.temas.includes(t)} className="sr-only" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-2xl font-bold">3. ¿Cuánto sabes ya?</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ['principiante', 'Estoy empezando', 'Quiero bases sólidas.'],
              ['intermedio', 'Tengo bases', 'Quiero profundizar.'],
              ['avanzado', 'Tengo experiencia', 'Busco temas avanzados.'],
            ].map(([valor, titulo, texto]) => (
              <label key={valor} className={`${tarjetaOpcion} flex-col items-start`}>
                <input type="radio" name="nivel" value={valor} defaultChecked={actual?.nivel === valor} className="sr-only" />
                <span className="font-bold">{titulo}</span>
                <span className="text-sm text-tinta-2">{texto}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-borde pt-8 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" formAction={omitirBienvenidaAccion} className="boton boton-fantasma">
            Prefiero que la IA aprenda de lo que vea
          </button>
          <BotonEnviar className="boton boton-primario h-14 px-8 text-lg" pendiente="Preparando tus recomendaciones…">
            Ver mis recomendaciones
          </BotonEnviar>
        </div>
      </form>
    </div>
  );
}
