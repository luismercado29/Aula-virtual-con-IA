/** Convierte enlaces de YouTube/Vimeo en su URL de inserto (YouTube sin cookies). */
export function urlInserto(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const yt = u.hostname.includes('youtu.be') ? u.pathname.slice(1)
      : u.hostname.includes('youtube.com') ? (u.searchParams.get('v') ?? u.pathname.split('/').pop()) : null;
    if (yt && /^[\w-]{6,20}$/.test(yt)) return { tipo: 'iframe' as const, src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&cc_load_policy=1&cc_lang_pref=es` };
    const vimeo = u.hostname.includes('vimeo.com') ? u.pathname.split('/').filter(Boolean).pop() : null;
    if (vimeo && /^\d+$/.test(vimeo)) return { tipo: 'iframe' as const, src: `https://player.vimeo.com/video/${vimeo}?texttrack=es` };
    if (/\.(mp4|webm)$/i.test(u.pathname) && u.protocol === 'https:') return { tipo: 'video' as const, src: u.toString() };
  } catch { /* URL invalida */ }
  return null;
}
