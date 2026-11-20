// Creates 3 demo artists (password: demo1234) and 6 tracks. Replace audio URLs/CIDs with real Creative Commons files.
require('dotenv').config();
const mysql = require('mysql2/promise'), bcrypt = require('bcryptjs');
(async () => {
  const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASS || '', database: process.env.DB_NAME || 'fairstream' });
  const hash = await bcrypt.hash('demo1234', 10);
  for (const [i, name] of ['Amani Beats', 'Zuri Kay', 'Kito Waves'].entries()) {
    const [u] = await db.query("INSERT INTO users (email,password_hash,role) VALUES (?,?, 'artist')", [`artist${i + 1}@demo.com`, hash]);
    const [a] = await db.query('INSERT INTO artists (user_id,stage_name) VALUES (?,?)', [u.insertId, name]);
    for (const n of [1, 2]) await db.query('INSERT INTO tracks (artist_id,title,ipfs_cid) VALUES (?,?,?)', [a.insertId, `${name} - Track ${n}`, 'REPLACE_WITH_CID_OR_MP3_URL']);
  }
  console.log('Seeded. Artist logins: artist1@demo.com / demo1234 (and artist2, artist3)'); process.exit();
})();
