export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-[1.45rem] font-bold tracking-tight ${claro ? 'text-white' : 'text-tinta'}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-8" fill="none">
        <rect width="32" height="32" rx="9" fill="#4F2BD9" />
        <path d="M9 22.5 15.2 9h1.6L23 22.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="23.5" cy="9.5" r="3.2" fill="#FF5A1F" />
      </svg>
      <span className="max-[359px]:sr-only"><span className="serif text-[1.15em]">Aula</span> IA</span>
    </span>
  );
}
