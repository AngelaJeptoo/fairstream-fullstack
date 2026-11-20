export const btn = 'rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50';
export const btn2 = 'rounded-lg border border-line px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50';
export const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-mint';
export const Card = ({ title, children, className = '' }) => (<section className={`rounded-xl border border-line bg-panel p-5 ${className}`}>{title && <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mute">{title}</h2>}{children}</section>);
export const Stat = ({ label, value }) => (<div className="rounded-xl border border-line bg-panel p-4"><div className="text-xs uppercase tracking-widest text-mute">{label}</div><div className="mt-1 text-2xl font-semibold text-mint">{value}</div></div>);
export const Bar = ({ label, pct, right }) => (<div className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="text-mute">{right}</span></div><div className="h-2 rounded bg-white/10"><div className="h-2 rounded bg-mint" style={{ width: `${Math.min(100, pct)}%` }} /></div></div>);
export const Msg = ({ text, error }) => (text ? <p role="status" className={`my-2 text-sm ${error ? 'text-red-400' : 'text-mint'}`}>{text}</p> : null);
export const Empty = ({ children }) => <p className="text-sm text-mute">{children}</p>;
export const Cover = ({ track, className = 'h-12 w-12' }) => (track?.cover_url
  ? <img src={track.cover_url} alt="" className={`${className} shrink-0 rounded-lg object-cover`} />
  : <div className={`${className} grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-950 text-sm font-bold text-mint`}>{(track?.title || '♪')[0]}</div>);
