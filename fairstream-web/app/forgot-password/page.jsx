'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { btn, input, Msg } from '@/components/ui';

export default function Forgot() {
  const [email, setEmail] = useState(''), [msg, setMsg] = useState(''), [err, setErr] = useState(false), [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr(false);
    try { const d = await api('/auth/forgot', { method: 'POST', body: { email } }); setMsg(d.message); }
    catch (x) { setErr(true); setMsg(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <div className="text-xl font-bold text-mint">fairstream</div>
        <h1 className="text-2xl font-semibold">Forgot your password?</h1>
        <p className="text-sm text-mute">Enter your email and we will send you a link to choose a new one.</p>
        <label className="block text-sm">Email<input required type="email" className={input} value={email} onChange={e => setEmail(e.target.value)} /></label>
        <Msg text={msg} error={err} />
        <button disabled={busy} className={`${btn} w-full`}>{busy ? 'Sending...' : 'Send reset link'}</button>
        <Link href="/login" className="block text-center text-sm text-mint hover:underline">Back to log in</Link>
      </form>
    </div>
  );
}
