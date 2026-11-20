'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, kes } from '@/lib/api';
import { Card, Empty, Msg, btn } from '@/components/ui';

export default function Settlement() {
  const [pre, setPre] = useState(null), [runs, setRuns] = useState([]), [msg, setMsg] = useState(''), [err, setErr] = useState(false), [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setPre(await api('/admin/settlement/preview')); setRuns(await api('/admin/settlements')); } catch (e) { setErr(true); setMsg(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const run = async () => {
    if (!window.confirm(`Run settlement for ${pre.subscriptions} subscription(s), total ${kes(pre.total)}? This cannot be undone.`)) return;
    setBusy(true);
    try { const d = await api('/admin/settle', { method: 'POST' }); setErr(false); setMsg(`Settled ${d.settledSubscriptions} subscription(s), ${kes(d.total)}. Funding: ${d.fundingTx}`); load(); }
    catch (e) { setErr(true); setMsg(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Month-end settlement</h1><Msg text={msg} error={err} />
      <Card title="Preview (nothing is paid yet)">{!pre ? <Empty>Loading...</Empty> : !pre.subscriptions ? <Empty>No active subscriptions to settle.</Empty> : (<>
        <p className="mb-3 text-sm">{pre.subscriptions} active subscription(s), {pre.complimentary} free. Total to artists: <strong className="text-mint">{kes(pre.total)}</strong></p>
        {pre.artists.length ? pre.artists.map(a => (<div key={a.artist_id} className="flex justify-between border-t border-line py-2 text-sm first:border-0"><span>{a.stage_name}</span><span>{kes(a.kes)}</span></div>)) : <Empty>No qualifying plays yet.</Empty>}
        {pre.missingWallets.length > 0 && <p className="mt-3 text-sm text-red-400">No wallet connected for: {pre.missingWallets.join(', ')}. Their share will stay in the database but not be funded on-chain.</p>}
        <button disabled={busy} onClick={run} className={`${btn} mt-4`}>{busy ? 'Running...' : 'Run settlement'}</button></>)}</Card>
      <Card title="History">{!runs.length ? <Empty>No settlements run yet.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-mute"><tr><th className="py-1">Date</th><th>Period</th><th>Subscriptions</th><th>Total</th><th>Transaction</th></tr></thead>
          <tbody>{runs.map(r => (<tr key={r.run_id} className="border-t border-line"><td className="py-2">{new Date(r.created_at).toLocaleString()}</td><td>{r.period}</td><td>{r.subscriptions}</td><td>{kes(r.total_kes)}</td><td className="max-w-[10rem] truncate text-xs text-mute">{r.tx_hash}</td></tr>))}</tbody></table></div>)}</Card>
    </div>
  );
}
