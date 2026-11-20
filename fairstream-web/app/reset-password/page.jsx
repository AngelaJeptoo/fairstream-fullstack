'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { btn, input, Msg } from '@/components/ui';

export default function Reset() {
  const router = useRouter();
  const [token, setToken] = useState(''), [pw, setPw] = useState(''), [pw2, setPw2] = useState(''), [msg, setMsg] = useState(''), [err, setErr] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') || ''); }, []);
  const submit = async e => {
    e.preventDefault(); setErr(true);
    if (pw !== pw2) return setMsg('The two passwords do not match.');
    setBusy(true);
    try { await api('/auth/reset', { method: 'POST', body: { token, password: pw } }); setErr(false); setMsg('Password changed. Taking you to log in...'); setTimeout(() => router.push('/login'), 1500); }
    catch (x) { setMsg(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <div className="text-xl font-bold text-mint">fairstream</div>
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        {!token && <p className="text-sm text-red-400">This page needs the link from your email. <Link href="/forgot-password" className="underline">Request a new one</Link>.</p>}
        <label className="block text-sm">New password<input required type="password" minLength={8} className={input} value={pw} onChange={e => setPw(e.target.value)} /></label>
        <label className="block text-sm">Confirm password<input required type="password" minLength={8} className={input} value={pw2} onChange={e => setPw2(e.target.value)} /></label>
        <Msg text={msg} error={err} />
        <button disabled={busy || !token} className={`${btn} w-full`}>{busy ? 'Saving...' : 'Change password'}</button>
      </form>
    </div>
  );
}
