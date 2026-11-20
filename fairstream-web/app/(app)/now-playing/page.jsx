'use client';
import Link from 'next/link';
import { usePlayer } from '@/components/Shell';
import { Cover, btn } from '@/components/ui';

export default function NowPlaying() {
  const { cur, playing, toggle, next, prev, t, d, seek, fmt } = usePlayer();
  if (!cur) return (<div className="mx-auto max-w-md pt-16 text-center"><p className="mb-4 text-mute">Nothing is playing yet.</p><Link href="/discover" className={btn}>Browse tracks</Link></div>);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 pt-6 text-center">
      <Cover track={cur} className="h-64 w-64 text-6xl" />
      <div><h1 className="text-2xl font-bold">{cur.title}</h1><p className="text-mute">{cur.stage_name}</p><span className="mt-2 inline-block rounded-full border border-line px-2 py-0.5 text-xs text-mint">{cur.license}</span></div>
      {cur.description && <p className="text-sm text-mute">{cur.description}</p>}
      <input aria-label="Seek" type="range" min="0" max={d || 0} value={t} onChange={e => seek(+e.target.value)} className="w-full" />
      <div className="flex w-full justify-between text-xs text-mute"><span>{fmt(t)}</span><span>{fmt(d)}</span></div>
      <div className="flex items-center gap-4 text-2xl"><button aria-label="Previous" onClick={prev}>⏮</button>
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className="grid h-14 w-14 place-items-center rounded-full bg-mint text-black">{playing ? '⏸' : '▶'}</button>
        <button aria-label="Next" onClick={next}>⏭</button></div>
      <p className="text-xs text-mute">After 30 seconds, this play starts earning royalties for the artist.</p>
    </div>
  );
}
