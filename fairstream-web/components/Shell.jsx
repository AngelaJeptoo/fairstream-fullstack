'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, getToken, getRole, logout, audioSrc } from '@/lib/api';
import { Cover } from './ui';

const Ctx = createContext(null);
export const usePlayer = () => useContext(Ctx);
const NAV = [['/discover', 'Discover'], ['/now-playing', 'Now Playing'], ['/dashboard', 'Dashboard'], ['/upload', 'Upload'], ['/wallet', 'Wallet']];
const fmt = s => `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`;

export default function Shell({ children }) {
  const router = useRouter(), path = usePathname(), au = useRef(null), counted = useRef(false);
  const [ready, setReady] = useState(false), [role, setRole] = useState('listener'), [me, setMe] = useState(null);
  const [queue, setQueue] = useState([]), [idx, setIdx] = useState(-1), [playing, setPlaying] = useState(false), [t, setT] = useState(0), [d, setD] = useState(0);
  const cur = queue[idx];

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    setRole(getRole()); setReady(true);
    api('/me').then(setMe).catch(e => { if (e.message.includes('log in')) logout(); });
  }, [router]);
  useEffect(() => { if (!cur || !au.current) return; counted.current = false; au.current.src = audioSrc(cur); au.current.play().catch(() => {}); }, [cur?.track_id]); // eslint-disable-line

  const toggle = () => { const a = au.current; if (a && cur) (a.paused ? a.play() : a.pause()); };
  const play = (list, i) => { if (list[i]?.track_id === cur?.track_id) return toggle(); setQueue(list); setIdx(i); };
  const next = () => queue.length && setIdx((idx + 1) % queue.length);
  const prev = () => queue.length && setIdx((idx - 1 + queue.length) % queue.length);
  const seek = s => { if (au.current) au.current.currentTime = s; };
  const onTime = e => { // a play only counts (and earns royalties) after 30 seconds
    setT(e.target.currentTime);
    if (!counted.current && e.target.currentTime >= 30 && cur) { counted.current = true; api(`/tracks/${cur.track_id}/play`, { method: 'POST', body: { seconds: 30 } }).catch(() => {}); }
  };
  if (!ready) return null;
  const nav = NAV.filter(([h]) => h !== '/upload' || role === 'artist');

  return (
    <Ctx.Provider value={{ cur, playing, t, d, play, toggle, next, prev, seek, role, me, fmt }}>
      <div className="flex h-screen flex-col bg-bg md:flex-row">
        <aside className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-line bg-panel p-2 md:w-56 md:flex-col md:items-stretch md:border-b-0 md:border-r md:p-4">
          <div className="mr-2 text-lg font-bold text-mint md:mb-6">fairstream</div>
          {nav.map(([h, l]) => (<Link key={h} href={h} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${path === h ? 'bg-mint/15 text-mint' : 'text-mute hover:text-white'}`}>{l}</Link>))}
          <Link href="/profile" className="ml-auto flex items-center gap-2 rounded-lg p-2 hover:bg-white/5 md:ml-0 md:mt-auto">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-mint/20 text-xs font-bold text-mint">{(me?.name || '?')[0].toUpperCase()}</div>
            <div className="hidden text-left md:block"><div className="text-sm">{me?.name || '...'}</div><div className="text-xs capitalize text-mute">{role}</div></div>
          </Link>
        </aside>
        <main className="flex-1 overflow-y-auto p-5 pb-32 md:p-8">{children}</main>
      </div>
      <audio ref={au} onTimeUpdate={onTime} onLoadedMetadata={e => setD(e.target.duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={next} />
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-panel/95 px-4 py-2 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Cover track={cur} className="h-10 w-10" />
          <div className="min-w-0 flex-1"><div className="truncate text-sm">{cur?.title || 'Nothing playing'}</div><div className="truncate text-xs text-mute">{cur?.stage_name || 'Pick a song from Discover'}</div></div>
          <div className="flex items-center gap-1 text-lg">
            <button aria-label="Previous" onClick={prev} className="px-2">⏮</button>
            <button aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full bg-mint text-black">{playing ? '⏸' : '▶'}</button>
            <button aria-label="Next" onClick={next} className="px-2">⏭</button>
          </div>
          <span className="hidden text-xs text-mute sm:block">{fmt(t)} / {fmt(d)}</span>
        </div>
        <input aria-label="Seek" type="range" min="0" max={d || 0} value={t} onChange={e => seek(+e.target.value)} className="mx-auto mt-1 block w-full max-w-4xl" />
      </div>
    </Ctx.Provider>
  );
}
