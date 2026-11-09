'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, saveSession } from '@/lib/api';
import { btn, input, Msg } from '@/components/ui';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState('login'), [f, setF] = useState({ email: '', password: '', role: 'listener', stageName: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { saveSession(await api(mode === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: f })); router.push('/discover'); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-emerald-900 to-bg p-10 md:flex">
        <div className="text-xl font-bold text-mint">fairstream</div>
        <div><h1 className="text-4xl font-bold leading-tight">Fair pay for every stream.</h1>
          <p className="mt-3 max-w-sm text-mute">Your subscription goes only to the artists you actually listen to, and every payout is visible.</p></div>
        <div className="text-xs text-mute">Listener-based royalties · Transparent payouts</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-3">
          <h2 className="text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <div className="flex gap-2 text-sm">
            {['login', 'register'].map(m => (<button type="button" key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1 ${mode === m ? 'bg-mint/15 text-mint' : 'text-mute'}`}>{m === 'login' ? 'Log in' : 'Sign up'}</button>))}
          </div>
          <label className="block text-sm">Email<input required type="email" className={input} value={f.email} onChange={set('email')} /></label>
          <label className="block text-sm">Password<input required type="password" minLength={8} className={input} value={f.password} onChange={set('password')} /></label>
          {mode === 'register' && (<>
            <div className="flex gap-2">{['listener', 'artist'].map(r => (<button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${f.role === r ? 'border-mint text-mint' : 'border-line text-mute'}`}>I'm a {r}</button>))}</div>
            {f.role === 'artist' && <label className="block text-sm">Stage name<input className={input} value={f.stageName} onChange={set('stageName')} /></label>}
          </>)}
          <Msg text={err} error />
          <button disabled={busy} className={`${btn} w-full`}>{busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
      </div>
    </div>
  );
}
