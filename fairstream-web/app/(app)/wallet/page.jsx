'use client';
import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { api, kes } from '@/lib/api';
import { usePlayer } from '@/components/Shell';
import { Bar, Card, Empty, Msg, btn, btn2, input } from '@/components/ui';

export default function Wallet() {
  const { role } = usePlayer();
  const [me, setMe] = useState(null), [subs, setSubs] = useState([]), [split, setSplit] = useState(null), [pend, setPend] = useState(null), [cfg, setCfg] = useState({}), [key, setKey] = useState('');
  const [msg, setMsg] = useState(''), [err, setErr] = useState(false);
  const say = (m, e = false) => { setMsg(m); setErr(e); };
  const load = useCallback(async () => {
    try {
      setMe(await api('/me')); setSubs(await api('/me/subscriptions')); setSplit(await api('/me/split')); setCfg(await api('/config'));
      if (role === 'artist') setPend(await api('/artist/pending'));
    } catch (e) { say(e.message, true); }
  }, [role]);
  useEffect(() => { load(); }, [load]);
  const run = f => async () => { try { await f(); } catch (e) { say(e.message, true); } };

  const connect = run(async () => {
    if (!window.ethereum) throw new Error('MetaMask was not found. Install it to connect a wallet.');
    const [a] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    await api('/me/wallet', { method: 'POST', body: { address: a } }); say('Wallet connected.'); load();
  });
  const subscribe = run(async () => { const d = await api('/subscribe', { method: 'POST' }); say(`Paid ${kes(d.paid)}: ${kes(d.pool)} to artists, ${kes(d.platformShare)} to FairStream.`); load(); });
  const claim = run(async () => {
    let tx = 'SIMULATED';
    if (cfg.contract) { const signer = await new BrowserProvider(window.ethereum).getSigner(); const t = await new Contract(cfg.contract, ['function claim()'], signer).claim(); await t.wait(); tx = t.hash; }
    const d = await api('/artist/claim', { method: 'POST', body: { txHash: tx } }); say(d.claimed ? `Claimed. Transaction: ${d.txHash}` : 'Nothing to claim yet.'); load();
  });
  const settle = run(async () => { const d = await api('/admin/settle', { method: 'POST', headers: { 'x-admin-key': key } }); say(`Settled ${d.settledSubscriptions} subscription(s). Funding: ${d.fundingTx}`); load(); });

  const sub = me?.subscription, active = sub?.status === 'active';
  const renews = sub ? new Date(new Date(sub.start_date).setMonth(new Date(sub.start_date).getMonth() + 1)).toDateString() : '-';
  return (
    <div className="mx-auto max-w-3xl space-y-4"><h1 className="text-2xl font-bold">Wallet & Subscription</h1><Msg text={msg} error={err} />
      <Card title="Connected wallet"><div className="flex flex-wrap items-center justify-between gap-2">
        <span className="break-all font-mono text-sm">{me?.wallet_address || 'No wallet connected'}</span><button onClick={connect} className={btn2}>{me?.wallet_address ? 'Change wallet' : 'Connect MetaMask'}</button></div></Card>
      <Card title="Subscription"><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><div className="text-mute">Plan</div>{sub?.name || 'Free'}</div><div><div className="text-mute">Status</div><span className={active ? 'text-mint' : ''}>{sub ? (active ? 'Active' : 'Renewal due') : 'Not subscribed'}</span></div>
        <div><div className="text-mute">Monthly price</div>{kes(sub?.price ?? 300)}</div><div><div className="text-mute">Renews</div>{renews}</div></div>
        {!active && <button onClick={subscribe} className={`${btn} mt-4`}>Subscribe to Premium (sandbox payment)</button>}
        <p className="mt-3 text-xs text-mute">80% of your payment goes to the artists you listen to, 20% supports FairStream.</p></Card>
      <Card title="Your listening pool">{!split?.subscribed ? <Empty>Subscribe to see where your money goes.</Empty> : !split.split.length ? <Empty>Play songs for 30 seconds or more to build your split.</Empty> : split.split.map(x => <Bar key={x.artist_id} label={x.stage_name} pct={x.percent} right={kes(x.kes)} />)}</Card>
      {role === 'artist' && <Card title="Artist royalties"><p className="mb-3">Pending: <strong className="text-mint">{kes(pend?.pending_kes)}</strong></p><button onClick={claim} className={btn}>Claim royalties</button>
        <p className="mt-2 text-xs text-mute">{cfg.contract ? 'Payout is sent to your wallet through the smart contract.' : 'Simulated mode: no smart contract is configured yet.'}</p></Card>}
      <Card title="Payment history">{!subs.length ? <Empty>No payments yet.</Empty> : subs.map(s => (<div key={s.subscription_id} className="flex justify-between border-t border-line py-2 text-sm first:border-0"><span>{new Date(s.start_date).toDateString()}</span><span className="text-mute">{s.status}</span><span>{kes(s.price)}</span></div>))}</Card>
      <Card title="Admin: month-end settlement (demo)"><div className="flex flex-wrap gap-2"><input type="password" placeholder="Admin key" className={`${input} max-w-xs`} value={key} onChange={e => setKey(e.target.value)} /><button onClick={settle} className={btn2}>Run settlement</button></div></Card>
    </div>
  );
}
