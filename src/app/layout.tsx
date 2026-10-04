import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Instrument_Sans, Instrument_Serif } from 'next/font/google';
import { cookies } from 'next/headers';

import { Cabecera } from '@/components/Cabecera';
import { Pie } from '@/components/Pie';
import { atributosHtml, COOKIE_ACCESIBILIDAD, leerCookie, normalizarPreferencias } from '@/lib/accesibilidad';
import { usuarioActual } from '@/lib/sesion';

import './globals.css';

// next/font descarga las fuentes en el build y las sirve desde el propio dominio:
// sin peticiones a Google en tiempo de ejecucion y con font-display: swap.
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--fuente-sans', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--fuente-serif', display: 'swap' });
// Atkinson Hyperlegible: creada por el Braille Institute para personas con baja vision.
const legible = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--fuente-legible', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Aula IA · Aprende lo que te mueve', template: '%s · Aula IA' },
  description: 'Aula virtual accesible con recomendaciones de cursos impulsadas por inteligencia artificial que aprenden de lo que estudias.',
  applicationName: 'Aula IA',
};

export const viewport: Viewport = {
  themeColor: '#14121F',
  // Nunca se bloquea el zoom: es una herramienta basica para personas con baja vision.
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [usuario, almacen] = await Promise.all([usuarioActual(), cookies()]);
  // Las preferencias de la cuenta mandan; si no hay sesion, las de la cookie del navegador.
  const preferencias = usuario && Object.keys(usuario.accesibilidad).length
    ? normalizarPreferencias(usuario.accesibilidad)
    : leerCookie(almacen.get(COOKIE_ACCESIBILIDAD)?.value);
  const { className, ...atributos } = atributosHtml(preferencias);

  return (
    <html lang="es" className={`${sans.variable} ${serif.variable} ${legible.variable} ${className}`} {...atributos}>
      <body className="min-h-dvh flex flex-col">
        <a className="saltar" href="#contenido">Saltar al contenido principal</a>
        <Cabecera usuario={usuario} preferencias={preferencias} />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
