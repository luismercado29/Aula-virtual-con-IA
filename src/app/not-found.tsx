import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <div className="contenedor grid min-h-[60dvh] place-items-center py-16 text-center">
      <div>
        <p className="serif text-[8rem] leading-none text-marca">404</p>
        <h1 className="mt-4 text-3xl font-bold">No encontramos esta página</h1>
        <p className="mt-2 text-tinta-2">Puede que el enlace esté mal escrito o que el curso ya no exista.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="boton boton-primario">Ir al inicio</Link>
          <Link href="/explorar" className="boton boton-secundario">Explorar cursos</Link>
        </div>
      </div>
    </div>
  );
}
