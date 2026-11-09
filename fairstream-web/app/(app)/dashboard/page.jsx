'use client';
import { useEffect, useState } from 'react';
import { api, kes } from '@/lib/api';
import { usePlayer } from '@/components/Shell';
import { Bar, Card, Empty, Msg, Stat } from '@/components/ui';

export default function Dashboard() { const { role } = usePlayer(); return role === 'artist' ? <ArtistDash /> : <ListenerDash />; }

function ListenerDash() {
  const [s, setS] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api('/me/split').then(setS).catch(e => setErr(e.message)); }, []);
  return (
    <div className="mx-auto max-w-3xl space-y-4"><h1 className="text-2xl font-bold">Where your money goes</h1><Msg text={err} error />
      <Card title="This month's listening split">
        {!s ? <Empty>Loading...</Empty> : !s.subscribed ? <Empty>Subscribe on the Wallet page to start funding artists.</Empty> : !s.split.length ? <Empty>Play a song for 30 seconds or more to see your split.</Empty> : (<>
          <p className="mb-3 text-sm text-mute">Your pool of {kes(s.pool)} is shared by listening time.</p>
          {s.split.map(x => <Bar key={x.artist_id} label={x.stage_name} pct={x.percent} right={`${x.percent}% · ${kes(x.kes)}`} />)}</>)}
      </Card></div>
  );
}

function ArtistDash() {
  const [s, setS] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api('/artist/stats').then(setS).catch(e => setErr(e.message)); }, []);
  if (!s) return <div className="mx-auto max-w-4xl"><Msg text={err} error />{!err && <Empty>Loading...</Empty>}</div>;
  const months = Object.entries(s.settlements.reduce((m, x) => ({ ...m, [x.period]: (m[x.period] || 0) + Number(x.amount_kes) }), {})).reverse();
  const max = Math.max(1, ...months.map(m => m[1]));
  return (
    <div className="mx-auto max-w-4xl space-y-4"><h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Pending" value={kes(s.pending_kes)} /><Stat label="Paid out" value={kes(s.paid_kes)} /><Stat label="Streams" value={s.streams} /><Stat label="Listeners" value={s.listeners} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Monthly earnings">{!months.length ? <Empty>No settled months yet.</Empty> : (
          <div className="flex h-32 items-end gap-2">{months.map(([p, v]) => (<div key={p} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><div className="w-full rounded-t bg-mint" style={{ height: `${(v / max) * 100}%` }} /><span className="text-xs text-mute">{p.slice(5)}</span></div>))}</div>)}</Card>
        <Card title="Top tracks">{!s.tracks.length ? <Empty>Upload a track to get started.</Empty> : s.tracks.map(t => <Bar key={t.title} label={t.title} pct={(t.plays / Math.max(1, s.tracks[0].plays)) * 100} right={`${t.plays} plays`} />)}</Card>
      </div>
      <Card title="Royalty history">{!s.settlements.length ? <Empty>Payouts appear after the first month-end settlement.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-mute"><tr><th className="py-1">Period</th><th>Amount</th><th>Status</th><th>Transaction</th></tr></thead>
          <tbody>{s.settlements.map((x, i) => (<tr key={i} className="border-t border-line"><td className="py-2">{x.period}</td><td>{kes(x.amount_kes)}</td><td className={x.status === 'paid' ? 'text-mint' : 'text-mute'}>{x.status}</td><td className="max-w-[10rem] truncate text-xs text-mute">{x.tx_hash || '-'}</td></tr>))}</tbody></table></div>)}</Card>
    </div>
  );
}
