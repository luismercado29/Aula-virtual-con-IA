import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { usuarioActual } from '@/lib/sesion';

import { FormularioRegistro } from '../FormularioIngreso';
import { PlantillaCuenta } from '../PlantillaCuenta';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function Registro({ searchParams }: { searchParams: Promise<{ rol?: string }> }) {
  if (await usuarioActual()) redirect('/');
  const { rol } = await searchParams;
  return (
    <PlantillaCuenta titulo={<>Empieza a <span className="serif text-marca">aprender</span>.</>} subtitulo="Gratis. Sin tarjeta. Te llevará menos de un minuto.">
      <FormularioRegistro rolInicial={rol === 'profesor' ? 'profesor' : 'estudiante'} />
    </PlantillaCuenta>
  );
}
