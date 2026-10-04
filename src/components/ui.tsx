import { Star } from 'lucide-react';

/** Calificacion: las estrellas son decorativas; el lector de pantalla oye el texto. */
export function Estrellas({ valor, total, tamano = 'sm' }: { valor: number | null; total?: number; tamano?: 'sm' | 'md' }) {
  if (valor == null) return <span className="text-sm text-tinta-2">Sin reseñas aún</span>;
  const icono = tamano === 'md' ? 'size-5' : 'size-4';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-bold text-estrella-texto" aria-hidden="true">{valor.toFixed(1).replace('.', ',')}</span>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${icono} ${valor >= i - 0.25 ? 'fill-estrella text-estrella' : 'text-borde-fuerte'}`} />
        ))}
      </span>
      {total != null && <span className="text-sm text-tinta-2" aria-hidden="true">({total.toLocaleString('es-CO')})</span>}
      <span className="sr-only">Calificación {valor.toFixed(1).replace('.', ',')} de 5{total != null ? `, ${total} reseñas` : ''}</span>
    </span>
  );
}

export function BarraProgreso({ valor, etiqueta, tono = 'marca' }: { valor: number; etiqueta: string; tono?: 'marca' | 'exito' }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-borde">
      <div className={`h-full rounded-full ${tono === 'exito' ? 'bg-exito' : 'bg-marca'}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export const NIVEL_TEXTO = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' } as const;

export function duracionTexto(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function Aviso({ tono = 'info', children }: { tono?: 'info' | 'exito' | 'error' | 'aviso'; children: React.ReactNode }) {
  const estilos = {
    info: 'border-marca/30 bg-marca-suave', exito: 'border-exito/30 bg-exito-suave',
    error: 'border-error/30 bg-error-suave', aviso: 'border-aviso/30 bg-aviso-suave',
  }[tono];
  return <div role={tono === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 ${estilos}`}>{children}</div>;
}
