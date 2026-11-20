// Usage: npm run make-admin -- you@example.com   (the account must already exist: sign up first)
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });
const mysql = require('mysql2/promise');
(async () => {
  const email = process.argv[2];
  if (!email) { console.log('Usage: npm run make-admin -- you@example.com'); process.exit(1); }
  const db = await mysql.createConnection(require('./dbconfig')());
  const [r] = await db.query("UPDATE users SET role='admin' WHERE email=?", [email]);
  console.log(r.affectedRows ? `Done. ${email} is now an admin. Log out and log in again.` : 'No user found with that email. Sign up first.');
  process.exit();
})();
