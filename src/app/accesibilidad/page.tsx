import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Declaración de accesibilidad' };

const SECCIONES = [
  { t: 'Lectores de pantalla', items: [
    'Estructura semántica: regiones (cabecera, navegación, contenido, pie), encabezados en orden y listas reales.',
    'Todos los botones, enlaces y campos tienen un nombre accesible; los íconos decorativos se ocultan.',
    'Los cambios importantes (resultados de evaluaciones, filtros, avisos) se anuncian con regiones vivas.',
    'Las calificaciones con estrellas se leen como texto («Calificación 4,6 de 5»).',
    'Probado con NVDA, VoiceOver y la navegación por teclado del navegador.',
  ] },
  { t: 'Teclado', items: [
    'Todo se puede usar sin mouse, en un orden lógico, con el foco siempre visible y grueso.',
    'Un enlace «Saltar al contenido principal» al inicio de cada página.',
    'Los menús y diálogos se cierran con Escape y devuelven el foco al control que los abrió.',
    'Las filas de cursos usan scroll nativo: no secuestran la rueda ni el teclado.',
  ] },
  { t: 'Visión baja y lectura', items: [
    'Texto ampliable hasta 200 % sin perder contenido, y zoom del navegador permitido.',
    'Modo de alto contraste, fuente Atkinson Hyperlegible, espaciado amplio y enlaces subrayados.',
    'Contraste mínimo 4,5:1 en el texto; la información nunca depende solo del color.',
    'Lectura de lecciones en voz alta con velocidad ajustable.',
  ] },
  { t: 'Audio y video', items: [
    'Cada video incluye su transcripción completa, legible en una línea braille.',
    'Los reproductores insertados activan los subtítulos en español cuando existen.',
    'Al publicar un video, la plataforma recuerda al profesor agregar la transcripción.',
  ] },
  { t: 'Movimiento', items: [
    'Se respeta «reducir movimiento» del sistema y existe un ajuste propio en el aula.',
    'La cinta animada de la portada tiene un botón para pausarla.',
  ] },
];

export default function Accesibilidad() {
  return (
    <div className="contenedor max-w-3xl py-12">
      <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-tight tracking-[-0.035em]">Accesibilidad para <span className="serif text-marca">todas</span> las personas</h1>
      <p className="mt-4 text-lg text-tinta-2">
        Aula IA busca cumplir las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA. Puedes ajustar la experiencia desde el botón «Accesibilidad» de la cabecera.
      </p>
      {SECCIONES.map((s) => (
        <section key={s.t} aria-labelledby={s.t} className="mt-10">
          <h2 id={s.t} className="text-2xl font-bold">{s.t}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
        </section>
      ))}
      <section aria-labelledby="limitaciones" className="mt-10">
        <h2 id="limitaciones" className="text-2xl font-bold">Limitaciones conocidas</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Los videos de plataformas externas (YouTube, Vimeo) dependen de la accesibilidad de su reproductor.</li>
          <li>La lectura en voz alta usa las voces instaladas en tu dispositivo; su calidad varía según el sistema.</li>
        </ul>
      </section>
      <section aria-labelledby="contacto" className="mt-10 rounded-2xl bg-marca-suave p-6">
        <h2 id="contacto" className="text-xl font-bold">¿Encontraste una barrera?</h2>
        <p className="mt-2">Escríbenos a <a href="mailto:accesibilidad@aula.demo" className="font-semibold text-marca underline">accesibilidad@aula.demo</a> indicando la página y lo que ocurrió. Respondemos en un máximo de 5 días hábiles.</p>
      </section>
    </div>
  );
}
