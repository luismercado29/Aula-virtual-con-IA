import { Aviso } from '@/components/ui';

const OK: Record<string, string> = {
  creado: 'Curso creado. Completa la información y agrega lecciones.', guardado: 'Cambios guardados.',
  publicado: '¡Curso publicado! Ya aparece en el catálogo y en las recomendaciones.', despublicado: 'El curso volvió a borrador.',
  modulo: 'Módulo agregado.', eliminado: 'Eliminado.', pregunta: 'Pregunta agregada.', rol: 'Rol actualizado.',
};

export function Mensajes({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <Aviso tono="error">{error}</Aviso>;
  if (ok && OK[ok]) return <Aviso tono="exito">{OK[ok]}</Aviso>;
  return null;
}
