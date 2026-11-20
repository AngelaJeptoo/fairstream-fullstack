'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, Empty, Msg } from '@/components/ui';

export default function Audit() {
  const [rows, setRows] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api('/admin/audit').then(setRows).catch(e => setErr(e.message)); }, []);
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Audit log</h1><Msg text={err} error />
      <Card>{!rows ? <Empty>Loading...</Empty> : !rows.length ? <Empty>No admin actions recorded yet.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-mute"><tr><th className="py-1">Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={i} className="border-t border-line align-top"><td className="py-2 text-xs text-mute">{new Date(r.created_at).toLocaleString()}</td><td>{r.admin}</td><td className="text-mint">{r.action}</td><td>{r.target}</td><td className="text-xs text-mute">{r.detail}</td></tr>))}</tbody></table></div>)}</Card>
    </div>
  );
}
