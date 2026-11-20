# FairStream full stack
fairstream-api  -> Express + MySQL + smart contract (port 4000)
fairstream-web  -> Next.js + Tailwind (port 3000)

API:  cd fairstream-api; copy .env.example to .env and fill it in; npm install
      mysql -u root -p < schema.sql   (existing database: migrate.sql instead)
      npm run seed ; npm start
WEB:  cd fairstream-web; copy .env.local.example to .env.local; npm install ; npm run dev
