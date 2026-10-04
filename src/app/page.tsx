import { ArrowRight, Brain, Captions, Compass, Ear, Keyboard, Sparkles, Type } from 'lucide-react';
import Link from 'next/link';

import { FilaCursos } from '@/components/FilaCursos';
import { AnimacionesPortada } from '@/components/portada/AnimacionesPortada';
import { CintaCategorias } from '@/components/portada/CintaCategorias';
import { PortadaCurso } from '@/components/PortadaCurso';
import { Aviso } from '@/components/ui';
import { categoriasConConteo, cursosPublicados } from '@/lib/consultas';
import { populares } from '@/lib/recomendador/motor';
import { inicioPersonalizado } from '@/lib/recomendador/servicio';
import { usuarioActual } from '@/lib/sesion';

export default async function Inicio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const usuario = await usuarioActual();
  const params = await searchParams;
  return usuario ? <InicioEstudiante usuarioId={usuario.id} nombre={usuario.nombre} aviso={params.bienvenida} /> : <Portada />;
}

// ------------------------------------------------------------------ portada publica

async function Portada() {
  const [cursos, categorias] = await Promise.all([cursosPublicados(), categoriasConConteo()]);
  const top = populares({ cursos: cursos.map((c) => ({ ...c, categoria: c.categoria.slug, categoriaNombre: c.categoria.nombre })), inscritos: new Set() }, undefined, 10)
    .map((p) => cursos.find((c) => c.id === p.cursoId)!);
  const destacados = top.slice(0, 3);

  return (
    <AnimacionesPortada>
      {/* Heroe editorial */}
      <section aria-labelledby="titular" className="relative overflow-hidden">
        <div className="contenedor grid items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-20">
          <div>
            <p data-anim="entrada" className="etiqueta-chip"><Sparkles className="size-4" aria-hidden="true" /> Recomendaciones con inteligencia artificial</p>
            <h1 id="titular" data-anim="titular" className="mt-6 text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.92] tracking-[-0.045em]">
              Aprende lo que te <span className="serif text-marca">mueve</span>.
            </h1>
            <p data-anim="entrada" className="mt-7 max-w-xl text-xl text-tinta-2">
              Un aula virtual que aprende de lo que estudias para recomendarte, como lo haría un buen tutor, el siguiente curso perfecto para ti. Accesible para todas las personas.
            </p>
            <div data-anim="entrada" className="mt-9 flex flex-wrap gap-3">
              <Link href="/registro" className="boton boton-primario h-14 px-7 text-lg">Empieza gratis <ArrowRight className="size-5" aria-hidden="true" /></Link>
              <Link href="/explorar" className="boton boton-secundario h-14 px-7 text-lg">Explorar cursos</Link>
            </div>
            <ul data-anim="entrada" className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-tinta-2">
              <li><strong className="block text-3xl font-bold text-tinta">{cursos.length}</strong> cursos</li>
              <li><strong className="block text-3xl font-bold text-tinta">{categorias.length}</strong> áreas</li>
              <li><strong className="block text-3xl font-bold text-tinta">WCAG 2.2</strong> accesible</li>
            </ul>
          </div>
          <div aria-hidden="true" className="relative mx-auto h-[26rem] w-full max-w-md sm:h-[32rem]">
            {destacados.map((c, i) => (
              <div key={c.id} data-anim="portada"
                className="absolute w-[72%] overflow-hidden rounded-3xl shadow-elevada"
                style={{ aspectRatio: '4/5', left: ['0%', '28%', '12%'][i], top: ['4%', '16%', '42%'][i], rotate: ['-8deg', '7deg', '-2deg'][i], zIndex: i }}>
                <PortadaCurso titulo={c.titulo} color={c.categoria.color} icono={c.categoria.icono} categoria={c.categoria.nombre} grande />
              </div>
            ))}
          </div>
        </div>
      </section>

      <CintaCategorias categorias={categorias} />

      {/* Como funciona */}
      <section aria-labelledby="como-titulo" className="contenedor py-24">
        <h2 id="como-titulo" data-anim="titulo-seccion" className="max-w-3xl text-[clamp(2.2rem,5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
          Una IA que te <span className="serif">conoce</span> mejor con cada clase.
        </h2>
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            { icono: Compass, titulo: 'Cuéntanos qué te interesa', texto: 'Al entrar eliges temas y nivel. Si prefieres no decir nada, la IA espera a verte estudiar.' },
            { icono: Brain, titulo: 'Aprende de lo que haces', texto: 'Cada curso que ves, terminas o calificas le enseña algo. Lo antiguo pierde peso con el tiempo.' },
            { icono: Sparkles, titulo: 'Te recomienda y te explica por qué', texto: 'Mezcla tus temas, lo que eligieron estudiantes parecidos a ti y la calidad de cada curso.' },
          ].map((p, i) => (
            <li key={p.titulo} className="revelar tarjeta p-8">
              <span data-anim="numero" aria-hidden="true" className="serif block text-7xl leading-none text-marca">0{i + 1}</span>
              <p.icono className="mt-6 size-7 text-acento-texto" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">{p.titulo}</h3>
              <p className="mt-2 text-tinta-2">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="contenedor revelar">
        <FilaCursos id="populares-portada" titulo="Los favoritos de la comunidad" descripcion="Lo más valorado por quienes ya estudian aquí." cursos={top} />
      </div>

      {/* Accesibilidad */}
      <section aria-labelledby="accesible-titulo" className="mt-16 bg-noche py-24 text-white sobre-oscuro">
        <div className="contenedor grid gap-14 lg:grid-cols-2">
          <div>
            <h2 id="accesible-titulo" data-anim="titulo-seccion" className="text-[clamp(2.2rem,5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
              Diseñada para <span className="serif text-[#FFD166]">todas</span> las personas.
            </h2>
            <p className="revelar mt-6 max-w-lg text-lg text-white/80">
              Puedes estudiar con lector de pantalla, solo con teclado, con el texto al doble de tamaño o escuchando las lecciones en voz alta.
            </p>
            <Link href="/accesibilidad" className="revelar boton boton-claro mt-8">Conoce nuestra accesibilidad <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icono: Ear, t: 'Lectores de pantalla', d: 'Estructura semántica y nombres claros para NVDA, JAWS, VoiceOver y TalkBack.' },
              { icono: Keyboard, t: 'Solo con teclado', d: 'Todo se puede usar sin mouse, con el foco siempre visible.' },
              { icono: Captions, t: 'Transcripciones', d: 'Cada video tiene su transcripción completa, legible en línea braille.' },
              { icono: Type, t: 'Lectura a tu medida', d: 'Texto hasta 200 %, alto contraste, fuente legible y lectura en voz alta.' },
            ].map((f) => (
              <li key={f.t} className="revelar rounded-2xl border border-white/15 bg-white/5 p-6">
                <f.icono className="size-7 text-[#FFD166]" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-white">{f.t}</h3>
                <p className="mt-1 text-white/75">{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="cta-titulo" className="contenedor py-24 text-center">
        <h2 id="cta-titulo" data-anim="titulo-seccion" className="mx-auto max-w-4xl text-[clamp(2.4rem,6vw,5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
          Tu próximo curso favorito ya te está <span className="serif text-marca">esperando</span>.
        </h2>
        <Link href="/registro" className="revelar boton boton-primario mt-10 h-14 px-8 text-lg">Crear mi cuenta gratis <ArrowRight className="size-5" aria-hidden="true" /></Link>
      </section>
    </AnimacionesPortada>
  );
}

// ------------------------------------------------------------------ inicio con sesion

async function InicioEstudiante({ usuarioId, nombre, aviso }: { usuarioId: number; nombre: string; aviso?: string }) {
  const { estado, filas } = await inicioPersonalizado(usuarioId);
  const primerNombre = nombre.split(' ')[0];
  const hora = new Date().toLocaleString('es-CO', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' });
  const saludo = Number(hora) < 12 ? 'Buenos días' : Number(hora) < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="contenedor pb-20 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-tinta-2">{saludo},</p>
          <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] font-bold tracking-[-0.035em]"><span className="serif">{primerNombre}</span>.</h1>
        </div>
        <Link href="/perfil/intereses" className="boton boton-secundario"><Brain className="size-5" aria-hidden="true" />Lo que la IA sabe de ti</Link>
      </header>

      {aviso === '1' && <div className="mt-6"><Aviso tono="exito">¡Listo! Con tus intereses ya preparamos tus primeras recomendaciones. Mejorarán a medida que estudies.</Aviso></div>}

      {estado === 'frio' && (
        <section aria-labelledby="conociendo" className="mt-8 overflow-hidden rounded-3xl bg-noche p-8 text-white sobre-oscuro md:p-12">
          <Sparkles className="size-8 text-[#FFD166]" aria-hidden="true" />
          <h2 id="conociendo" className="mt-4 max-w-2xl text-3xl font-bold md:text-4xl">Aún te estamos <span className="serif text-[#FFD166]">conociendo</span>.</h2>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            No elegiste intereses, así que la IA esperará a ver qué exploras. Abre cualquier curso que te llame la atención: en cuanto empieces, aparecerán aquí tus recomendaciones personales.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/explorar" className="boton boton-claro">Explorar cursos</Link>
            <Link href="/bienvenida" className="boton border border-white/30 text-white hover:bg-white/10">Elegir mis intereses ahora</Link>
          </div>
        </section>
      )}

      {filas.map((f) => (
        <FilaCursos key={f.id} id={f.id} titulo={f.titulo} descripcion={f.descripcion} cursos={f.cursos}
          razones={f.razones} progresos={f.progresos} desdeRecomendacion={f.tipo === 'ia'}
          icono={f.tipo === 'ia' ? <Sparkles className="size-6 text-marca" aria-hidden="true" /> : undefined} />
      ))}
    </div>
  );
}
