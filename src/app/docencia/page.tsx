import { Plus, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { crearCursoAccion } from '@/app/acciones/docencia';
import { BotonEnviar } from '@/components/formulario';
import { Estrellas } from '@/components/ui';
import { categoriasConConteo, cursosDelProfesor } from '@/lib/consultas';
import { requerirRol } from '@/lib/sesion';

import { Mensajes } from './Mensajes';

export const metadata: Metadata = { title: 'Panel de docencia' };

export default async function Docencia({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; aviso?: string }> }) {
  const usuario = await requerirRol(['profesor', 'admin'], '/docencia');
  const [cursos, categorias, msg] = await Promise.all([cursosDelProfesor(usuario.id, usuario.rol === 'admin'), categoriasConConteo(), searchParams]);
  const totalEstudiantes = cursos.reduce((s, c) => s + c.inscritos, 0);

  return (
    <div className="contenedor py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2.4rem,5vw,3.5rem)] font-bold tracking-[-0.035em]">Panel de <span className="serif text-marca">docencia</span></h1>
          <p className="mt-2 text-tinta-2">{usuario.rol === 'admin' ? 'Todos los cursos de la plataforma.' : 'Tus cursos y tus estudiantes.'}</p>
        </div>
        {usuario.rol === 'admin' && <Link href="/docencia/usuarios" className="boton boton-secundario"><Users className="size-5" aria-hidden="true" />Usuarios y roles</Link>}
      </div>
      <div className="mt-6"><Mensajes ok={msg.ok} error={msg.error ?? (msg.aviso === 'sin-permiso' ? 'No tienes permiso para editar ese curso.' : undefined)} /></div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="tarjeta p-6"><dt className="text-tinta-2">Cursos</dt><dd className="text-3xl font-bold">{cursos.length}</dd></div>
        <div className="tarjeta p-6"><dt className="text-tinta-2">Publicados</dt><dd className="text-3xl font-bold">{cursos.filter((c) => c.estado === 'publicado').length}</dd></div>
        <div className="tarjeta p-6"><dt className="text-tinta-2">Estudiantes</dt><dd className="text-3xl font-bold">{totalEstudiantes.toLocaleString('es-CO')}</dd></div>
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="mis-cursos">
          <h2 id="mis-cursos" className="text-2xl font-bold">Cursos</h2>
          {cursos.length ? (
            <ul className="mt-5 divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {cursos.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-4 p-5">
                  <span aria-hidden="true" className="size-12 shrink-0 rounded-xl" style={{ background: c.categoria.color }} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold"><Link href={`/docencia/cursos/${c.id}`} className="hover:underline">{c.titulo}</Link></h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-4 text-sm text-tinta-2">
                      <span className={c.estado === 'publicado' ? 'font-semibold text-exito' : 'font-semibold text-aviso'}>{c.estado === 'publicado' ? 'Publicado' : 'Borrador'}</span>
                      <span>{c.inscritos} estudiantes</span>
                      <Estrellas valor={c.promedio} total={c.nResenas} />
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/docencia/cursos/${c.id}/estudiantes`} className="boton boton-fantasma">Calificaciones<span className="sr-only"> de {c.titulo}</span></Link>
                    <Link href={`/docencia/cursos/${c.id}`} className="boton boton-secundario">Editar<span className="sr-only"> {c.titulo}</span></Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-tinta-2">Aún no tienes cursos. Crea el primero con el formulario.</p>}
        </section>

        <section aria-labelledby="nuevo-curso">
          <form action={crearCursoAccion} className="tarjeta space-y-4 p-6 lg:sticky lg:top-24">
            <h2 id="nuevo-curso" className="flex items-center gap-2 text-xl font-bold"><Plus className="size-5" aria-hidden="true" />Crear un curso</h2>
            <div className="space-y-1.5"><label htmlFor="n-titulo" className="font-semibold">Título <span aria-hidden="true" className="text-error">*</span></label>
              <input id="n-titulo" name="titulo" required minLength={5} maxLength={120} className="campo" /></div>
            <div className="space-y-1.5"><label htmlFor="n-sub" className="font-semibold">Subtítulo</label>
              <input id="n-sub" name="subtitulo" maxLength={200} className="campo" /></div>
            <div className="space-y-1.5"><label htmlFor="n-cat" className="font-semibold">Categoría <span aria-hidden="true" className="text-error">*</span></label>
              <select id="n-cat" name="categoria" required className="campo">{categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}</select></div>
            <div className="space-y-1.5"><label htmlFor="n-nivel" className="font-semibold">Nivel</label>
              <select id="n-nivel" name="nivel" className="campo"><option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option></select></div>
            <BotonEnviar className="boton boton-primario w-full" pendiente="Creando…">Crear borrador</BotonEnviar>
          </form>
        </section>
      </div>
    </div>
  );
}
