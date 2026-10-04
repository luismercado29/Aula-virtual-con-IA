import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { destinoSeguro, usuarioActual } from '@/lib/sesion';

import { FormularioIngreso } from '../FormularioIngreso';
import { PlantillaCuenta } from '../PlantillaCuenta';

export const metadata: Metadata = { title: 'Ingresar' };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  if (await usuarioActual()) redirect(destinoSeguro(siguiente));
  return (
    <PlantillaCuenta titulo={<>Qué bueno <span className="serif text-marca">verte</span>.</>} subtitulo="Ingresa para continuar donde lo dejaste.">
      <FormularioIngreso siguiente={destinoSeguro(siguiente)} />
    </PlantillaCuenta>
  );
}
