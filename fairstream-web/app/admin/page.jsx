'use client';
import { useEffect, useState } from 'react';
import { api, kes } from '@/lib/api';
import { Card, Empty, Msg, Stat } from '@/components/ui';

export default function Overview() {
  const [d, setD] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api('/admin/overview').then(setD).catch(e => setErr(e.message)); }, []);
  if (!d) return (<><Msg text={err} error />{!err && <Empty>Loading...</Empty>}</>);
  const max = Math.max(1, ...d.daily.map(x => x.n));
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Platform overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Listeners" value={d.users.listener || 0} /><Stat label="Artists" value={d.users.artist || 0} />
        <Stat label="Active subscriptions" value={`${d.activeSubs} (${d.compSubs} free)`} /><Stat label="Streams this month" value={d.streamsMonth} />
        <Stat label="Revenue this month" value={kes(d.revenue)} /><Stat label="Platform share (20%)" value={kes(d.platformShare)} />
        <Stat label="Royalties pending" value={kes(d.pendingKes)} /><Stat label="Royalties paid" value={kes(d.paidKes)} />
      </div>
      <Card title="Streams, last 14 days">{!d.daily.length ? <Empty>No streams yet.</Empty> : (
        <div className="flex h-32 items-end gap-1">{d.daily.map(x => (<div key={x.d} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><div className="w-full rounded-t bg-mint" style={{ height: `${(x.n / max) * 100}%` }} title={`${x.n} streams`} /><span className="text-[10px] text-mute">{x.d}</span></div>))}</div>)}</Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Top tracks">{!d.top.length ? <Empty>No plays yet.</Empty> : d.top.map(t => (<div key={t.title} className="flex justify-between border-t border-line py-2 text-sm first:border-0"><span>{t.title}<span className="text-mute"> · {t.stage_name}</span></span><span className="text-mute">{t.plays} plays</span></div>))}</Card>
        <Card title="Live activity">{!d.recent.length ? <Empty>No activity yet.</Empty> : d.recent.map((r, i) => (<div key={i} className="border-t border-line py-2 text-sm first:border-0"><div className="truncate">{r.email} played <span className="text-mint">{r.title}</span></div><div className="text-xs text-mute">{r.stage_name} · {new Date(r.played_at).toLocaleString()}</div></div>))}</Card>
      </div>
    </div>
  );
}
