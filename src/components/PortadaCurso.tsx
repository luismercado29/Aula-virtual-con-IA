import { IconoCategoria } from './Iconos';

/**
 * Portada generada con CSS a partir de la categoria: carga instantanea, sin
 * imagenes externas, y nitida a cualquier tamano. Es decorativa (aria-hidden):
 * el titulo del curso ya esta en el texto de la tarjeta.
 */
export function PortadaCurso({ titulo, color, icono, categoria, grande = false }: {
  titulo: string; color: string; icono: string; categoria: string; grande?: boolean;
}) {
  // Variacion estable por titulo para que cada curso del mismo color se vea distinto.
  let h = 0;
  for (const ch of titulo) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const angulo = 120 + (h % 120);
  const x = 20 + (h % 60);
  const palabra = titulo.split(' ').sort((a, b) => b.length - a.length)[0];
  // Palabras largas en un tamano menor para que nunca se partan a la mitad.
  const tamano = grande
    ? (palabra.length > 11 ? 'text-[2.6rem]' : palabra.length > 8 ? 'text-5xl' : 'text-6xl')
    : (palabra.length > 11 ? 'text-[1.7rem]' : palabra.length > 8 ? 'text-[2.1rem]' : 'text-[2.6rem]');
  return (
    <div aria-hidden="true" className="portada relative isolate size-full overflow-hidden"
      style={{ background: `linear-gradient(${angulo}deg, ${color} 0%, color-mix(in srgb, ${color} 55%, #14121F) 100%)` }}>
      <div className="absolute inset-0 opacity-25"
        style={{ background: `radial-gradient(circle at ${x}% 20%, #fff 0, transparent 45%), radial-gradient(circle at 90% 110%, #FF5A1F 0, transparent 40%)` }} />
      <div className="absolute -bottom-6 -right-4 opacity-15">
        <IconoCategoria nombre={icono} className={grande ? 'size-56' : 'size-36'} strokeWidth={1.2} color="#fff" />
      </div>
      <div className={`relative flex h-full flex-col justify-between text-white ${grande ? 'p-7' : 'p-5'}`}>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
          <IconoCategoria nombre={icono} className="size-4" /> {categoria}
        </span>
        <span className={`serif leading-[0.95] ${tamano}`}>{palabra}</span>
      </div>
    </div>
  );
}
