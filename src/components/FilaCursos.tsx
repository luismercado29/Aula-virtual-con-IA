import type { TarjetaCurso as Datos } from '@/lib/consultas';

import { DesplazarCarril } from './DesplazarCarril';
import { TarjetaCurso } from './TarjetaCurso';

/**
 * Fila horizontal tipo Netflix. Es una lista real (el lector anuncia "lista,
 * N elementos") con scroll nativo: funciona con teclado, trackpad y tactil,
 * sin secuestrar la rueda del mouse.
 */
export function FilaCursos({ id, titulo, descripcion, cursos, razones, desdeRecomendacion = false, progresos, icono }: {
  id: string; titulo: React.ReactNode; descripcion?: React.ReactNode; cursos: Datos[];
  razones?: Map<number, string>; desdeRecomendacion?: boolean; progresos?: Map<number, number>; icono?: React.ReactNode;
}) {
  if (!cursos.length) return null;
  return (
    <section aria-labelledby={`${id}-titulo`} className="py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id={`${id}-titulo`} className="flex items-center gap-2 text-2xl font-bold md:text-[1.75rem]">{icono}{titulo}</h2>
          {descripcion && <p className="mt-1 text-tinta-2">{descripcion}</p>}
        </div>
        <DesplazarCarril idCarril={`${id}-carril`} etiqueta={typeof titulo === 'string' ? titulo : 'cursos'} />
      </div>
      <ul id={`${id}-carril`} className="carril" aria-labelledby={`${id}-titulo`}>
        {cursos.map((c) => (
          <li key={c.id}>
            <TarjetaCurso curso={c} razon={razones?.get(c.id)} desdeRecomendacion={desdeRecomendacion} progreso={progresos?.get(c.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
