'use client';

import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Lee la leccion en voz alta con la sintesis de voz del navegador (sin
 * servidores ni costos). Pensado para baja vision, dislexia o para escuchar
 * mientras se hace otra cosa. Las personas ciegas suelen usar su propio lector
 * de pantalla: este control no lo reemplaza ni interfiere con el.
 */
export function LeerEnVoz({ texto, velocidad = 1 }: { texto: string; velocidad?: number }) {
  const [estado, setEstado] = useState<'detenido' | 'leyendo' | 'pausado'>('detenido');
  const [soportado, setSoportado] = useState(false);
  const voz = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setSoportado(true);
    const elegir = () => {
      const voces = speechSynthesis.getVoices();
      voz.current = voces.find((v) => v.lang === 'es-CO') ?? voces.find((v) => v.lang.startsWith('es-4')) ?? voces.find((v) => v.lang.startsWith('es')) ?? null;
    };
    elegir();
    speechSynthesis.addEventListener('voiceschanged', elegir);
    return () => { speechSynthesis.removeEventListener('voiceschanged', elegir); speechSynthesis.cancel(); };
  }, []);

  if (!soportado) return null;

  const leer = () => {
    speechSynthesis.cancel();
    // Algunos navegadores cortan textos largos: se lee por frases.
    const frases = texto.match(/[^.!?]+[.!?]*/g) ?? [texto];
    frases.forEach((f, i) => {
      const u = new SpeechSynthesisUtterance(f.trim());
      u.lang = voz.current?.lang ?? 'es-ES';
      if (voz.current) u.voice = voz.current;
      u.rate = velocidad;
      if (i === frases.length - 1) u.onend = () => setEstado('detenido');
      speechSynthesis.speak(u);
    });
    setEstado('leyendo');
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lectura en voz alta">
      {estado === 'detenido' && (
        <button type="button" onClick={leer} className="boton boton-secundario"><Volume2 className="size-5" aria-hidden="true" />Escuchar lección</button>
      )}
      {estado === 'leyendo' && (
        <button type="button" onClick={() => { speechSynthesis.pause(); setEstado('pausado'); }} className="boton boton-secundario"><Pause className="size-5" aria-hidden="true" />Pausar</button>
      )}
      {estado === 'pausado' && (
        <button type="button" onClick={() => { speechSynthesis.resume(); setEstado('leyendo'); }} className="boton boton-secundario"><Play className="size-5" aria-hidden="true" />Reanudar</button>
      )}
      {estado !== 'detenido' && (
        <button type="button" onClick={() => { speechSynthesis.cancel(); setEstado('detenido'); }} className="boton boton-fantasma"><Square className="size-4" aria-hidden="true" />Detener</button>
      )}
      <span role="status" className="sr-only">{estado === 'leyendo' ? 'Leyendo la lección' : estado === 'pausado' ? 'Lectura en pausa' : ''}</span>
    </div>
  );
}
