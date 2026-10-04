import { notFound, redirect } from 'next/navigation';

import { cursoPorSlug, inscripcion, leccionParaContinuar } from '@/lib/consultas';
import { requerirUsuario } from '@/lib/sesion';

/** /aprender/curso -> la leccion donde quedo (o la primera pendiente). */
export default async function ContinuarCurso({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const usuario = await requerirUsuario(`/aprender/${slug}`);
  const curso = await cursoPorSlug(slug);
  if (!curso) notFound();
  const mia = await inscripcion(usuario.id, curso.id);
  if (!mia) redirect(`/cursos/${slug}`);
  const leccionId = mia.ultimaLeccionId ?? (await leccionParaContinuar(usuario.id, slug))?.id;
  if (!leccionId) redirect(`/cursos/${slug}`);
  redirect(`/aprender/${slug}/${leccionId}`);
}
