import Link from 'next/link';

import { Logo } from './Logo';

export function Pie() {
  return (
    <footer className="bg-noche text-white/80 sobre-oscuro">
      <div className="contenedor grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo claro />
          <p className="mt-4 max-w-xs">Un aula virtual que aprende de ti para recomendarte lo que de verdad te sirve. Accesible para todas las personas.</p>
        </div>
        {[
          { titulo: 'Aprender', enlaces: [['/explorar', 'Explorar cursos'], ['/mi-aprendizaje', 'Mi aprendizaje'], ['/perfil/intereses', 'Mis recomendaciones']] },
          { titulo: 'Enseñar', enlaces: [['/docencia', 'Panel de docencia'], ['/registro?rol=profesor', 'Ser profesor']] },
          { titulo: 'Plataforma', enlaces: [['/accesibilidad', 'Declaración de accesibilidad'], ['/como-recomendamos', 'Cómo recomendamos']] },
        ].map((g) => (
          <nav key={g.titulo} aria-label={g.titulo}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white">{g.titulo}</h2>
            <ul className="mt-4 space-y-2">
              {g.enlaces.map(([href, texto]) => (
                <li key={href}><Link href={href} className="hover:text-white hover:underline underline-offset-4">{texto}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="contenedor py-6 text-sm text-white/70">© {new Date().getFullYear()} Aula IA · Proyecto de portafolio de Luis Mercado.</p>
      </div>
    </footer>
  );
}
