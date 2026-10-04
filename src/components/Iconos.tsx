import {
  Accessibility, BookOpen, Briefcase, ChartColumn, CodeXml, Heart, Languages, Megaphone, Palette, type LucideProps,
} from 'lucide-react';

const POR_NOMBRE = {
  code: CodeXml, chart: ChartColumn, palette: Palette, briefcase: Briefcase,
  megaphone: Megaphone, languages: Languages, heart: Heart, accessibility: Accessibility, book: BookOpen,
} as const;

export function IconoCategoria({ nombre, ...props }: { nombre: string } & LucideProps) {
  const Icono = POR_NOMBRE[nombre as keyof typeof POR_NOMBRE] ?? BookOpen;
  return <Icono aria-hidden="true" {...props} />;
}
