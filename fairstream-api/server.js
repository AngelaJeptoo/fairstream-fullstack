require('dotenv').config();
const express = require('express'), mysql = require('mysql2/promise'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), path = require('path'), cors = require('cors'), multer = require('multer'), fs = require('fs');
const app = express(); app.use(express.json()); app.use(cors({ origin: (process.env.WEB_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',').map(s => s.trim()) }));
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const upload = multer({ storage: multer.diskStorage({ destination: path.join(__dirname, 'uploads'), filename: (_, f, cb) => cb(null, Date.now() + path.extname(f.originalname)) }), limits: { fileSize: 40 * 1024 * 1024 } });
const db = mysql.createPool({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASS || '', database: process.env.DB_NAME || 'fairstream' });
const SECRET = process.env.JWT_SECRET || 'dev-secret', PLATFORM_CUT = 0.20, MIN_SECONDS = 30;
const KES_TO_WEI = BigInt(process.env.KES_TO_WEI || '1000000000000'); // demo rate; replace with Chainlink price feed
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const period = () => new Date().toISOString().slice(0, 7);
const auth = (req, res, next) => { try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); } catch { res.status(401).json({ error: 'Please log in again.' }); } };
const token = u => jwt.sign({ id: u.user_id, role: u.role }, SECRET, { expiresIn: '7d' });
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Something went wrong on the server.' }); });

// ---- Auth ----
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password, role = 'listener', stageName } = req.body;
  if (!email || !password || password.length < 8) return res.status(400).json({ error: 'Enter an email and a password of at least 8 characters.' });
  if ((await q('SELECT 1 FROM users WHERE email=?', [email])).length) return res.status(409).json({ error: 'That email is already registered.' });
  const r = role === 'artist' ? 'artist' : 'listener';
  const [ins] = await db.query('INSERT INTO users (email,password_hash,role) VALUES (?,?,?)', [email, await bcrypt.hash(password, 10), r]);
  if (r === 'artist') await q('INSERT INTO artists (user_id,stage_name) VALUES (?,?)', [ins.insertId, stageName || email.split('@')[0]]);
  res.json({ token: token({ user_id: ins.insertId, role: r }), role: r });
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const [u] = await q('SELECT * FROM users WHERE email=?', [req.body.email]);
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password_hash))) return res.status(401).json({ error: 'Invalid credentials.' });
  res.json({ token: token(u), role: u.role });
}));
app.post('/api/me/wallet', auth, wrap(async (req, res) => { await q('UPDATE users SET wallet_address=? WHERE user_id=?', [req.body.address, req.user.id]); res.json({ ok: true }); }));
app.get('/api/config', (_, res) => res.json({ contract: process.env.CONTRACT_ADDRESS || '' }));

// ---- Music + play logging ----
app.get('/api/tracks', auth, wrap(async (_, res) => res.json(await q('SELECT t.track_id,t.title,t.description,t.ipfs_cid,t.cover_url,t.license,a.stage_name FROM tracks t JOIN artists a USING(artist_id)'))));
app.post('/api/tracks/:id/play', auth, wrap(async (req, res) => {
  const s = parseInt(req.body.seconds, 10) || 0;
  if (s < MIN_SECONDS) return res.json({ counted: false });
  await q('INSERT INTO stream_logs (user_id,track_id,seconds_played) VALUES (?,?,?)', [req.user.id, req.params.id, s]);
  res.json({ counted: true });
}));

// ---- Subscription (sandbox: replace body with a Paystack/Daraja webhook confirmation) ----
app.post('/api/subscribe', auth, wrap(async (req, res) => {
  if ((await q("SELECT 1 FROM subscriptions WHERE user_id=? AND status='active'", [req.user.id])).length) return res.status(409).json({ error: 'You already have an active subscription.' });
  const [plan] = await q("SELECT * FROM plans WHERE name='Premium'");
  const pool = +(plan.price * (1 - PLATFORM_CUT)).toFixed(2);
  await q("INSERT INTO subscriptions (user_id,plan_id,start_date,pool_amount) VALUES (?,?,CURDATE(),?)", [req.user.id, plan.plan_id, pool]);
  res.json({ paid: +plan.price, pool, platformShare: +(plan.price - pool).toFixed(2) });
}));

// ---- Listener-based split ----
async function splitFor(userId, pool) { // returns kes per track for one subscriber
  const rows = await q(`SELECT t.track_id,a.artist_id,a.stage_name,SUM(l.seconds_played) secs FROM stream_logs l JOIN tracks t USING(track_id) JOIN artists a USING(artist_id)
    WHERE l.user_id=? AND DATE_FORMAT(l.played_at,'%Y-%m')=? GROUP BY t.track_id,a.artist_id,a.stage_name`, [userId, period()]);
  const total = rows.reduce((s, r) => s + Number(r.secs), 0);
  return rows.map(r => ({ track_id: r.track_id, artist_id: r.artist_id, stage_name: r.stage_name, kes: pool * r.secs / total }));
}
const byArtist = rows => {
  const m = {}; rows.forEach(r => { m[r.artist_id] ??= { artist_id: r.artist_id, stage_name: r.stage_name, kes: 0 }; m[r.artist_id].kes += r.kes; });
  const list = Object.values(m), t = list.reduce((s, x) => s + x.kes, 0);
  return list.map(x => ({ ...x, kes: +x.kes.toFixed(2), percent: +(100 * x.kes / t).toFixed(1) }));
};
app.get('/api/me/split', auth, wrap(async (req, res) => {
  const [sub] = await q("SELECT pool_amount FROM subscriptions WHERE user_id=? AND status='active'", [req.user.id]);
  if (!sub) return res.json({ subscribed: false, split: [] });
  res.json({ subscribed: true, pool: +sub.pool_amount, split: byArtist(await splitFor(req.user.id, +sub.pool_amount)) });
}));

// ---- Month-end settlement (admin button) ----
async function fundChain(list) {
  const { ethers } = require('ethers');
  const w = new ethers.Wallet(process.env.OWNER_KEY, new ethers.JsonRpcProvider(process.env.RPC_URL));
  const c = new ethers.Contract(process.env.CONTRACT_ADDRESS, ['function fund(address[] a,uint256[] amts) payable'], w);
  const amts = list.map(x => BigInt(Math.round(x.kes * 100)) * KES_TO_WEI / 100n);
  const tx = await c.fund(list.map(x => x.wallet), amts, { value: amts.reduce((a, b) => a + b, 0n) });
  await tx.wait(); return tx.hash;
}
app.post('/api/admin/settle', wrap(async (req, res) => {
  if (req.headers['x-admin-key'] !== (process.env.ADMIN_KEY || 'change-me-too')) return res.status(403).json({ error: 'Admin key required.' });
  const subs = await q("SELECT * FROM subscriptions WHERE status='active'");
  const totals = {}, byWallet = {};
  for (const s of subs) for (const r of await splitFor(s.user_id, +s.pool_amount)) {
    totals[r.artist_id] = (totals[r.artist_id] || 0) + r.kes;
    const [aw] = await q('SELECT u.wallet_address w FROM artists a JOIN users u USING(user_id) WHERE a.artist_id=?', [r.artist_id]);
    let sp = await q('SELECT wallet_address w,percent FROM track_splits WHERE track_id=?', [r.track_id]);
    if (!sp.length) sp = [{ w: null, percent: 100 }];
    sp.forEach(x => { const w = x.w || (aw && aw.w); if (w) byWallet[w] = (byWallet[w] || 0) + r.kes * x.percent / 100; }); // collaborator splits
  }
  for (const [artistId, kes] of Object.entries(totals)) await q('INSERT INTO royalty_settlements (artist_id,period,amount_kes) VALUES (?,?,?)', [artistId, period(), kes.toFixed(2)]);
  await q("UPDATE subscriptions SET status='settled' WHERE status='active'");
  const onChain = Object.entries(byWallet).map(([wallet, kes]) => ({ wallet, kes }));
  let tx = 'SIMULATED';
  if (process.env.CONTRACT_ADDRESS && process.env.OWNER_KEY && onChain.length) tx = await fundChain(onChain);
  res.json({ settledSubscriptions: subs.length, artistTotals: totals, fundingTx: tx });
}));

// ---- Artist: pending royalties and claim ----
app.get('/api/artist/pending', auth, wrap(async (req, res) => {
  const [a] = await q('SELECT artist_id,stage_name FROM artists WHERE user_id=?', [req.user.id]);
  if (!a) return res.status(403).json({ error: 'Artist account required.' });
  const [r] = await q("SELECT COALESCE(SUM(amount_kes),0) kes FROM royalty_settlements WHERE artist_id=? AND status='pending'", [a.artist_id]);
  res.json({ stage_name: a.stage_name, pending_kes: +r.kes });
}));
app.post('/api/artist/claim', auth, wrap(async (req, res) => {
  const [a] = await q('SELECT artist_id FROM artists WHERE user_id=?', [req.user.id]);
  if (!a) return res.status(403).json({ error: 'Artist account required.' });
  const rows = await q("SELECT settlement_id FROM royalty_settlements WHERE artist_id=? AND status='pending'", [a.artist_id]);
  for (const r of rows) {
    await q("UPDATE royalty_settlements SET status='paid' WHERE settlement_id=?", [r.settlement_id]);
    await q('INSERT INTO payouts (settlement_id,tx_hash) VALUES (?,?)', [r.settlement_id, req.body.txHash || 'SIMULATED']);
  }
  res.json({ claimed: rows.length, txHash: req.body.txHash || 'SIMULATED' });
}));

// ---- Upload, tracks, profile, stats ----
app.post('/api/upload', auth, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' });
  if (process.env.PINATA_JWT) { // pin to IPFS when a Pinata key is set
    const fd = new FormData(); fd.append('file', new Blob([fs.readFileSync(req.file.path)]), req.file.originalname);
    const r = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.PINATA_JWT }, body: fd });
    const d = await r.json(); if (!r.ok) return res.status(502).json({ error: 'IPFS upload failed.' });
    return res.json({ url: 'https://gateway.pinata.cloud/ipfs/' + d.IpfsHash });
  }
  res.json({ url: `${process.env.PUBLIC_API || 'http://localhost:4000'}/uploads/${req.file.filename}` });
}));
app.post('/api/tracks', auth, wrap(async (req, res) => {
  const [a] = await q('SELECT artist_id FROM artists WHERE user_id=?', [req.user.id]);
  if (!a) return res.status(403).json({ error: 'Artist account required.' });
  const { title, description, audioUrl, coverUrl, splits = [] } = req.body;
  if (!title || !audioUrl) return res.status(400).json({ error: 'Add a title and an audio file.' });
  if (splits.length && Math.round(splits.reduce((s, x) => s + Number(x.percent), 0)) !== 100) return res.status(400).json({ error: 'Royalty splits must add up to 100%.' });
  const [ins] = await db.query('INSERT INTO tracks (artist_id,title,description,ipfs_cid,cover_url) VALUES (?,?,?,?,?)', [a.artist_id, title, description || null, audioUrl, coverUrl || null]);
  for (const x of splits) await q('INSERT INTO track_splits (track_id,collaborator_name,role,wallet_address,percent) VALUES (?,?,?,?,?)', [ins.insertId, x.name, x.role, x.wallet || null, x.percent]);
  res.json({ track_id: ins.insertId });
}));
app.get('/api/me', auth, wrap(async (req, res) => {
  const [u] = await q('SELECT u.email,u.role,u.wallet_address,u.created_at,a.stage_name FROM users u LEFT JOIN artists a USING(user_id) WHERE u.user_id=?', [req.user.id]);
  const [s] = await q('SELECT s.start_date,s.status,p.name,p.price FROM subscriptions s JOIN plans p USING(plan_id) WHERE s.user_id=? ORDER BY s.subscription_id DESC LIMIT 1', [req.user.id]);
  res.json({ ...u, name: u.stage_name || u.email.split('@')[0], subscription: s || null });
}));
app.get('/api/me/subscriptions', auth, wrap(async (req, res) => res.json(await q('SELECT s.subscription_id,s.start_date,s.status,s.pool_amount,p.price FROM subscriptions s JOIN plans p USING(plan_id) WHERE s.user_id=? ORDER BY s.subscription_id DESC', [req.user.id]))));
app.get('/api/artist/stats', auth, wrap(async (req, res) => {
  const [a] = await q('SELECT artist_id FROM artists WHERE user_id=?', [req.user.id]);
  if (!a) return res.status(403).json({ error: 'Artist account required.' });
  const [t] = await q('SELECT COUNT(*) streams,COUNT(DISTINCT l.user_id) listeners FROM stream_logs l JOIN tracks k USING(track_id) WHERE k.artist_id=?', [a.artist_id]);
  const tracks = await q('SELECT k.title,COUNT(l.log_id) plays FROM tracks k LEFT JOIN stream_logs l USING(track_id) WHERE k.artist_id=? GROUP BY k.track_id,k.title ORDER BY plays DESC', [a.artist_id]);
  const settlements = await q('SELECT s.period,s.amount_kes,s.status,p.tx_hash FROM royalty_settlements s LEFT JOIN payouts p USING(settlement_id) WHERE s.artist_id=? ORDER BY s.settlement_id DESC', [a.artist_id]);
  const sum = st => settlements.filter(x => x.status === st).reduce((n, x) => n + Number(x.amount_kes), 0);
  res.json({ streams: +t.streams, listeners: +t.listeners, tracks, settlements, pending_kes: +sum('pending').toFixed(2), paid_kes: +sum('paid').toFixed(2) });
}));

app.listen(process.env.PORT || 4000, () => console.log('FairStream API running on http://localhost:4000'));
