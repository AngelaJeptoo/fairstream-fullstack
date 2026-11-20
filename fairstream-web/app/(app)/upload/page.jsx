'use client';
import { useState } from 'react';
import { api, uploadFile } from '@/lib/api';
import { usePlayer } from '@/components/Shell';
import { Card, Msg, btn, btn2, input } from '@/components/ui';

const ROLES = ['Primary Artist', 'Producer', 'Featured Artist', 'Writer'];
const blank = { name: '', role: 'Featured Artist', wallet: '', percent: 0 };

export default function Upload() {
  const { role, me } = usePlayer();
  const [f, setF] = useState({ title: '', description: '' }), [audio, setAudio] = useState(null), [cover, setCover] = useState(null);
  const [splits, setSplits] = useState([{ name: '', role: 'Primary Artist', wallet: '', percent: 100 }]), [msg, setMsg] = useState(''), [err, setErr] = useState(false), [busy, setBusy] = useState(false);
  const total = splits.reduce((s, x) => s + Number(x.percent), 0);
  const upd = (i, k, v) => setSplits(splits.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  if (role !== 'artist') return <p className="text-mute">Only artist accounts can upload tracks.</p>;

  const submit = async e => {
    e.preventDefault(); setErr(false); setMsg('');
    if (!audio) { setErr(true); return setMsg('Choose an audio file.'); }
    if (total !== 100) { setErr(true); return setMsg(`Royalty splits add up to ${total}%. They must total 100%.`); }
    setBusy(true);
    try {
      setMsg('Uploading files...');
      const audioUrl = await uploadFile(audio), coverUrl = cover ? await uploadFile(cover) : null;
      await api('/tracks', { method: 'POST', body: { ...f, audioUrl, coverUrl, splits: splits.map(s => ({ ...s, name: s.name || me?.name || 'Artist' })) } });
      setMsg('Track published. It now appears on Discover.'); setF({ title: '', description: '' }); setAudio(null); setCover(null); e.target.reset();
    } catch (x) { setErr(true); setMsg(x.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4"><h1 className="text-2xl font-bold">Upload a track</h1>
      <Card title="Track details"><div className="space-y-2">
        <input required placeholder="Track title" className={input} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <textarea placeholder="Description (optional)" rows={2} className={input} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div></Card>
      <Card title="Files"><div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Audio file (mp3, wav)<input required type="file" accept="audio/*" onChange={e => setAudio(e.target.files[0])} className={`${input} mt-1`} /></label>
        <label className="text-sm">Cover art (optional)<input type="file" accept="image/*" onChange={e => setCover(e.target.files[0])} className={`${input} mt-1`} /></label></div></Card>
      <Card title="Royalty split">
        {splits.map((s, i) => (
          <div key={i} className="mb-3 space-y-2 rounded-lg border border-line p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input placeholder={i === 0 ? `${me?.name || 'Your name'}` : 'Collaborator name'} className={input} value={s.name} onChange={e => upd(i, 'name', e.target.value)} />
              <select className={input} value={s.role} onChange={e => upd(i, 'role', e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
              <input placeholder="Wallet 0x... (optional)" className={input} value={s.wallet} onChange={e => upd(i, 'wallet', e.target.value)} /></div>
            <div className="flex items-center gap-3"><input aria-label="Percent" type="range" min="0" max="100" value={s.percent} onChange={e => upd(i, 'percent', +e.target.value)} className="flex-1" /><span className="w-12 text-sm">{s.percent}%</span>
              {splits.length > 1 && <button type="button" onClick={() => setSplits(splits.filter((_, j) => j !== i))} className="text-xs text-red-400">Remove</button>}</div>
          </div>))}
        <div className="flex items-center justify-between"><button type="button" disabled={splits.length >= 5} onClick={() => setSplits([...splits, { ...blank }])} className={btn2}>+ Add collaborator</button>
          <span className={`text-sm ${total === 100 ? 'text-mint' : 'text-red-400'}`}>Total: {total}%</span></div>
        <p className="mt-2 text-xs text-mute">Leave a wallet empty to pay that share to your own connected wallet.</p></Card>
      <Msg text={msg} error={err} />
      <button disabled={busy} className={`${btn} w-full`}>{busy ? 'Publishing...' : 'Publish track'}</button>
    </form>
  );
}
