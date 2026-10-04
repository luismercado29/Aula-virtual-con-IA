import { Captions } from 'lucide-react';

import { urlInserto } from '@/lib/video';

/** Video con la transcripcion siempre disponible (personas sordas, sordociegas o que prefieren leer). */
export function VideoLeccion({ titulo, url, transcripcionHtml }: { titulo: string; url: string | null; transcripcionHtml: string }) {
  const inserto = urlInserto(url);
  return (
    <div className="space-y-5">
      {inserto ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-noche shadow-elevada">
          {inserto.tipo === 'iframe' ? (
            <iframe src={inserto.src} title={`Video: ${titulo}`} className="size-full" loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- la transcripcion completa esta justo debajo
            <video src={inserto.src} controls preload="metadata" className="size-full" aria-label={`Video: ${titulo}`} />
          )}
        </div>
      ) : (
        <p className="rounded-xl bg-aviso-suave px-4 py-3">El video de esta lección no está disponible. Puedes seguirla con la transcripción.</p>
      )}
      <details open={!inserto} className="tarjeta p-5">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><Captions className="size-5" aria-hidden="true" />Transcripción completa</summary>
        {transcripcionHtml
          ? <div className="prosa mt-4" dangerouslySetInnerHTML={{ __html: transcripcionHtml }} />
          : <p className="mt-3 text-tinta-2">El profesor aún no agregó la transcripción de este video.</p>}
      </details>
    </div>
  );
}
