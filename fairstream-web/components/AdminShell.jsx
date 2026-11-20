'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getRole, logout } from '@/lib/api';

const NAV = [['/admin', 'Overview'], ['/admin/users', 'Users'], ['/admin/settlement', 'Settlement'], ['/admin/audit', 'Audit log']];

export default function AdminShell({ children }) {
  const router = useRouter(), path = usePathname(), [ok, setOk] = useState(false);
  useEffect(() => { if (!getToken()) router.replace('/login'); else if (getRole() !== 'admin') router.replace('/discover'); else setOk(true); }, [router]);
  if (!ok) return null;
  return (
    <div className="flex h-screen flex-col bg-bg md:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-line bg-panel p-2 md:w-56 md:flex-col md:items-stretch md:border-b-0 md:border-r md:p-4">
        <div className="mr-2 md:mb-6"><div className="text-lg font-bold text-mint">fairstream</div><div className="text-xs uppercase tracking-widest text-mute">Admin</div></div>
        {NAV.map(([h, l]) => (<Link key={h} href={h} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${path === h ? 'bg-mint/15 text-mint' : 'text-mute hover:text-white'}`}>{l}</Link>))}
        <button onClick={logout} className="ml-auto rounded-lg px-3 py-2 text-left text-sm text-mute hover:text-white md:ml-0 md:mt-auto">Sign out</button>
      </aside>
      <main className="flex-1 overflow-y-auto p-5 md:p-8"><div className="mx-auto max-w-5xl">{children}</div></main>
    </div>
  );
}
