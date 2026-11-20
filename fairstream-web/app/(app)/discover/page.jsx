'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePlayer } from '@/components/Shell';
import { Card, Cover, Empty, Msg } from '@/components/ui';

export default function Discover() {
  const { play, cur, playing, me } = usePlayer();
  const [tracks, setTracks] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api('/tracks').then(setTracks).catch(e => setErr(e.message)); }, []);
  const h = new Date().getHours(), greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const artists = tracks ? [...new Set(tracks.map(t => t.stage_name))] : [];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-3xl font-bold">{greet}{me ? `, ${me.name}` : ''}.</h1><p className="text-mute">Your listening time pays the artists you play.</p></div>
      <Msg text={err} error />
      <Card title="Featured artists">
        {!tracks ? <Empty>Loading...</Empty> : !artists.length ? <Empty>No artists yet.</Empty> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{artists.map(a => (
            <div key={a} className="rounded-xl bg-bg p-3 text-center"><div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 text-xl font-bold text-mint">{a[0]}</div>
              <div className="truncate text-sm font-medium">{a}</div><div className="text-xs text-mute">{tracks.filter(t => t.stage_name === a).length} tracks</div></div>))}</div>)}
      </Card>
      <Card title="Tracks">
        {!tracks ? <Empty>Loading...</Empty> : !tracks.length ? <Empty>No tracks yet. Artists can add some on the Upload page.</Empty> : tracks.map((t, i) => (
          <div key={t.track_id} className="flex items-center gap-3 border-t border-line py-2 first:border-0">
            <Cover track={t} /><div className="min-w-0 flex-1"><div className="truncate text-sm">{t.title}</div><div className="text-xs text-mute">{t.stage_name}</div></div>
            <span className="hidden rounded-full border border-line px-2 py-0.5 text-xs text-mute sm:block">{t.license}</span>
            <button aria-label={`Play ${t.title}`} onClick={() => play(tracks, i)} className="grid h-9 w-9 place-items-center rounded-full bg-mint text-black">{cur?.track_id === t.track_id && playing ? '⏸' : '▶'}</button>
          </div>))}
      </Card>
    </div>
  );
}
