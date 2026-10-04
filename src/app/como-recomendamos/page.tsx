import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Cómo recomendamos' };

const PESOS = [
  ['Ver un curso', '+1'], ['Abrir una recomendación', '+1,5'], ['Participar en el foro', '+1,5'], ['Completar una lección', '+1'],
  ['Inscribirte', '+4'], ['Terminar un curso', '+6'], ['Aprobar con 100 / reprobar con 0', '+2 / −2'],
  ['Reseña de 5 / de 1 estrella', '+5 / −5'], ['«No me interesa»', '−10'],
];

export default function ComoRecomendamos() {
  return (
    <div className="contenedor max-w-3xl py-12">
      <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-tight tracking-[-0.035em]">Cómo <span className="serif text-marca">recomendamos</span></h1>
      <p className="mt-4 text-lg text-tinta-2">Sin cajas negras: así decide la IA qué mostrarte.</p>

      <section className="mt-10 space-y-4" aria-labelledby="inicio">
        <h2 id="inicio" className="text-2xl font-bold">1. Cuando llegas</h2>
        <p>Si eliges intereses en la bienvenida, la IA parte de ahí. Si no eliges nada, <strong>no inventa</strong>: espera a que explores un curso y entonces empieza a recomendarte.</p>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="aprende">
        <h2 id="aprende" className="text-2xl font-bold">2. Aprende de lo que haces</h2>
        <p>Cada acción suma o resta interés según el compromiso que muestra. Una señal de hace un mes vale la mitad que una de hoy, así que tus recomendaciones evolucionan contigo.</p>
        <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
          <table className="w-full text-left">
            <caption className="sr-only">Peso de cada acción en tu perfil de intereses</caption>
            <thead className="bg-papel text-sm uppercase tracking-wider text-tinta-2"><tr><th scope="col" className="px-5 py-3">Acción</th><th scope="col" className="px-5 py-3">Peso</th></tr></thead>
            <tbody className="divide-y divide-borde">{PESOS.map(([a, p]) => <tr key={a}><th scope="row" className="px-5 py-3 font-normal">{a}</th><td className="px-5 py-3 font-semibold">{p}</td></tr>)}</tbody>
          </table>
        </div>
        <p>Lo que buscas también cuenta: las palabras de tus búsquedas se suman como temas de interés.</p>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="combina">
        <h2 id="combina" className="text-2xl font-bold">3. Combina tres señales</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Tus temas:</strong> compara tu perfil (áreas, temas y nivel) con cada curso.</li>
          <li><strong>Estudiantes parecidos:</strong> cursos que tomaron quienes tomaron lo mismo que tú. Pesa más a medida que tienes más historial.</li>
          <li><strong>Calidad:</strong> cantidad de estudiantes y calificación ajustada, para no recomendarte cursos poco probados.</li>
        </ul>
        <p>Además sugiere el <strong>siguiente nivel</strong> de lo que terminaste y evita llenar la lista con un solo tema, para que descubras cosas nuevas.</p>
      </section>

      <section className="mt-10 space-y-4" aria-labelledby="control">
        <h2 id="control" className="text-2xl font-bold">4. Tú tienes el control</h2>
        <p>Cada recomendación dice por qué aparece. Puedes marcar «No me interesa», ver lo que la IA sabe de ti y reiniciarla cuando quieras.</p>
        <Link href="/perfil/intereses" className="boton boton-primario">Ver lo que la IA sabe de mí</Link>
      </section>
    </div>
  );
}
