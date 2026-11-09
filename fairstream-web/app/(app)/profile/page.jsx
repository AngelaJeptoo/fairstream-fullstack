'use client';
import { usePlayer } from '@/components/Shell';
import { logout, kes } from '@/lib/api';
import { Card, btn2 } from '@/components/ui';

export default function Profile() {
  const { me, role } = usePlayer();
  if (!me) return <p className="text-mute">Loading...</p>;
  const sub = me.subscription, row = (k, v) => (<div className="flex justify-between border-t border-line py-2 text-sm first:border-0"><span className="text-mute">{k}</span><span className="max-w-[60%] break-all text-right">{v}</span></div>);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-emerald-900/60 to-panel p-6">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-mint/20 text-3xl font-bold text-mint">{me.name[0].toUpperCase()}</div>
        <div><h1 className="text-2xl font-bold">{me.name}</h1><span className="rounded-full border border-mint/40 px-2 py-0.5 text-xs capitalize text-mint">{role}</span>
          <p className="mt-1 text-sm text-mute">Member since {new Date(me.created_at).getFullYear()}</p></div></div>
      <Card title="Account details">
        {row('Email', me.email)}{row('Membership', sub ? `${sub.name} (${sub.status === 'active' ? 'Active' : 'Renewal due'})` : 'Free')}
        {row('Monthly price', kes(sub?.price ?? 0))}{row('Connected wallet', me.wallet_address || 'None')}</Card>
      <button onClick={logout} className={btn2}>Sign out</button>
    </div>
  );
}
