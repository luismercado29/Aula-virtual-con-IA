import { Award, BookOpen, GraduationCap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { TarjetaCurso } from '@/components/TarjetaCurso';
import { BarraProgreso } from '@/components/ui';
import { misCursos } from '@/lib/consultas';
import { requerirUsuario } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Mi aprendizaje' };

export default async function MiAprendizaje() {
  const usuario = await requerirUsuario('/mi-aprendizaje');
  const cursos = await misCursos(usuario.id);
  const enCurso = cursos.filter((c) => !c.completado);
  const completados = cursos.filter((c) => c.completado);
  const notas = cursos.filter((c) => c.nota != null);
  const promedio = notas.length ? Math.round(notas.reduce((s, c) => s + (c.nota ?? 0), 0) / notas.length) : null;

  return (
    <div className="contenedor py-10">
      <h1 className="text-[clamp(2.4rem,5vw,3.5rem)] font-bold tracking-[-0.035em]">Mi <span className="serif text-marca">aprendizaje</span></h1>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icono: BookOpen, t: 'En curso', v: enCurso.length },
          { icono: GraduationCap, t: 'Completados', v: completados.length },
          { icono: Award, t: 'Nota promedio', v: promedio != null ? `${promedio}/100` : '—' },
        ].map((x) => (
          <div key={x.t} className="tarjeta grid grid-cols-[auto_1fr] items-center gap-x-4 p-6">
            <dt className="col-start-2 row-start-1 text-tinta-2">{x.t}</dt>
            <dd className="col-start-2 row-start-2 text-3xl font-bold">{x.v}</dd>
            <dd aria-hidden="true" className="col-start-1 row-span-2 row-start-1 grid size-12 place-items-center rounded-xl bg-marca-suave text-marca"><x.icono className="size-6" /></dd>
          </div>
        ))}
      </dl>

      {!cursos.length && (
        <div className="tarjeta mt-10 p-10 text-center">
          <h2 className="text-2xl font-bold">Aún no te inscribes en ningún curso</h2>
          <p className="mt-2 text-tinta-2">Explora el catálogo: cada curso que abras también le ayuda a la IA a conocerte.</p>
          <Link href="/explorar" className="boton boton-primario mt-6">Explorar cursos</Link>
        </div>
      )}

      {enCurso.length > 0 && (
        <section aria-labelledby="en-curso" className="mt-12">
          <h2 id="en-curso" className="text-2xl font-bold">En curso</h2>
          <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enCurso.map((c) => <li key={c.cursoId}><TarjetaCurso curso={c.curso} progreso={c.porcentaje} /></li>)}
          </ul>
        </section>
      )}

      {cursos.length > 0 && (
        <section aria-labelledby="calificaciones" className="mt-14">
          <h2 id="calificaciones" className="text-2xl font-bold">Calificaciones</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-borde bg-superficie">
            <table className="w-full min-w-[40rem] text-left">
              <caption className="sr-only">Progreso y nota de cada curso inscrito</caption>
              <thead className="bg-papel text-sm uppercase tracking-wider text-tinta-2">
                <tr><th scope="col" className="px-5 py-3">Curso</th><th scope="col" className="px-5 py-3">Progreso</th><th scope="col" className="px-5 py-3">Mejor nota</th><th scope="col" className="px-5 py-3">Estado</th></tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {cursos.map((c) => (
                  <tr key={c.cursoId}>
                    <th scope="row" className="px-5 py-4 font-semibold"><Link href={`/aprender/${c.curso.slug}`} className="hover:underline">{c.curso.titulo}</Link></th>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-32"><BarraProgreso valor={c.porcentaje} etiqueta={`Progreso en ${c.curso.titulo}`} tono={c.porcentaje === 100 ? 'exito' : 'marca'} /></div>{c.porcentaje}%</div></td>
                    <td className="px-5 py-4">{c.nota != null ? `${c.nota}/100` : '—'}</td>
                    <td className="px-5 py-4">{c.completado ? <span className="font-semibold text-exito">Completado</span> : 'En curso'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {completados.length > 0 && (
        <section aria-labelledby="completados" className="mt-14">
          <h2 id="completados" className="text-2xl font-bold">Completados</h2>
          <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completados.map((c) => <li key={c.cursoId}><TarjetaCurso curso={c.curso} progreso={100} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
