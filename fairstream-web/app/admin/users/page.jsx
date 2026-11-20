'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, Empty, Msg, btn2, input } from '@/components/ui';

export default function Users() {
  const [rows, setRows] = useState(null), [q, setQ] = useState(''), [msg, setMsg] = useState(''), [err, setErr] = useState(false);
  const load = useCallback(async (term = '') => { try { setRows(await api(`/admin/users?q=${encodeURIComponent(term)}`)); } catch (e) { setErr(true); setMsg(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const act = (fn, ok) => async () => { try { await fn(); setErr(false); setMsg(ok); load(q); } catch (e) { setErr(true); setMsg(e.message); } };
  const setStatus = (u, status) => act(() => { if (status === 'suspended' && !window.confirm(`Suspend ${u.email}? They will be signed out and blocked.`)) throw new Error('Cancelled.'); return api(`/admin/users/${u.user_id}/status`, { method: 'POST', body: { status } }); }, status === 'suspended' ? 'Account suspended.' : 'Account reactivated.');
  const grant = u => act(() => { if (!window.confirm(`Give ${u.email} one free month of Premium? The platform funds the artists' share.`)) throw new Error('Cancelled.'); return api(`/admin/users/${u.user_id}/grant`, { method: 'POST' }); }, 'Free month granted.');
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Users</h1>
      <form onSubmit={e => { e.preventDefault(); load(q); }} className="flex gap-2"><input className={`${input} max-w-sm`} placeholder="Search by email" value={q} onChange={e => setQ(e.target.value)} /><button className={btn2}>Search</button></form>
      <Msg text={msg} error={err} />
      <Card>{!rows ? <Empty>Loading...</Empty> : !rows.length ? <Empty>No users found.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-mute"><tr><th className="py-1">Email</th><th>Role</th><th>Status</th><th>Subscription</th><th>Streams</th><th>Last login</th><th /></tr></thead>
          <tbody>{rows.map(u => (<tr key={u.user_id} className="border-t border-line align-top">
            <td className="py-2">{u.email}</td><td className="capitalize">{u.role}</td><td className={u.status === 'active' ? 'text-mint' : 'text-red-400'}>{u.status}</td>
            <td>{u.sub_status ? `${u.sub_status}${u.sub_source === 'complimentary' ? ' (free)' : ''}` : 'none'}</td><td>{u.streams}</td><td className="text-xs text-mute">{u.last_login ? new Date(u.last_login).toLocaleString() : 'never'}</td>
            <td className="space-x-2 whitespace-nowrap text-right">{u.role !== 'admin' && (<>
              {u.sub_status !== 'active' && u.status === 'active' && <button onClick={grant(u)} className="text-xs text-mint hover:underline">Give free month</button>}
              {u.status === 'active' ? <button onClick={setStatus(u, 'suspended')} className="text-xs text-red-400 hover:underline">Suspend</button> : <button onClick={setStatus(u, 'active')} className="text-xs text-mint hover:underline">Reactivate</button>}</>)}</td></tr>))}</tbody></table></div>)}</Card>
      <p className="text-xs text-mute">Admins see account details and play counts only, not individual listening history. Every action here is recorded in the audit log.</p>
    </div>
  );
}
