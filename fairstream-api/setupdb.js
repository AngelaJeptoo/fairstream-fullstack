// Creates all FairStream tables in the database named in your env file.
// Usage (PowerShell):  $env:ENV_FILE=".env.production"; npm run db:setup
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });
const fs = require('fs'), mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createConnection({ ...require('./dbconfig')(), multipleStatements: true });
  await db.query(fs.readFileSync(__dirname + '/schema_hosted.sql', 'utf8'));
  const [t] = await db.query('SHOW TABLES');
  console.log(`Done. ${t.length} tables now exist.`);
  process.exit();
})().catch(e => { console.error('Setup failed:', e.message); process.exit(1); });
