import { Brain, Ear, Sparkles } from 'lucide-react';

export function PlantillaCuenta({ titulo, subtitulo, children }: { titulo: React.ReactNode; subtitulo: string; children: React.ReactNode }) {
  return (
    <div className="contenedor grid gap-12 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-20">
      <div className="order-2 hidden rounded-[2rem] bg-noche p-10 text-white lg:order-1 lg:flex lg:flex-col lg:justify-between sobre-oscuro" aria-hidden="true">
        <p className="serif text-5xl leading-tight">«Lo que más me gusta es que me recomienda cursos que de verdad me sirven.»</p>
        <ul className="mt-10 space-y-4 text-white/80">
          <li className="flex gap-3"><Sparkles className="size-6 text-[#FFD166]" />Recomendaciones que aprenden de ti</li>
          <li className="flex gap-3"><Brain className="size-6 text-[#FFD166]" />Tú decides qué sabe la IA y puedes reiniciarla</li>
          <li className="flex gap-3"><Ear className="size-6 text-[#FFD166]" />Lecciones en voz alta y lectores de pantalla</li>
        </ul>
      </div>
      <div className="order-1 mx-auto w-full max-w-md lg:order-2">
        <h1 className="text-5xl font-bold tracking-[-0.035em]">{titulo}</h1>
        <p className="mt-3 text-lg text-tinta-2">{subtitulo}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
