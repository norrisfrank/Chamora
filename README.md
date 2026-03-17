# Chamora

Chamora is a Node.js + Express backend with a static HTML frontend for managing chama groups, contributions, loans, meetings, and billing.

## Tech Stack
- Node.js, Express, Socket.IO
- PostgreSQL
- Static HTML/CSS/JS frontend served by Express

## Local Setup
1. Install dependencies:
   - npm install
2. Create a PostgreSQL database and set env vars.
3. Run schema:
   - npm run setup:db
4. Start server:
   - npm run dev

App runs on http://localhost:5000

## Environment Variables
Required:
- DATABASE_URL
- JWT_SECRET

M-Pesa (optional, required for billing endpoints):
- MPESA_CONSUMER_KEY
- MPESA_CONSUMER_SECRET
- MPESA_SHORTCODE
- MPESA_PASSKEY
- MPESA_CALLBACK_URL

Optional:
- NODE_ENV
- PORT

## Scripts
- npm run start
- npm run dev
- npm run setup:db

## Deploy to Render
1. Push this repo to GitHub.
2. Create a new Render Web Service from the repo.
3. Set build command: npm install
4. Set start command: npm run start
5. Add env vars in Render dashboard (see list above).
6. Create a Render PostgreSQL instance and set DATABASE_URL.
7. After first deploy, run: npm run setup:db from a Render Shell or locally against the Render DB.

## GitHub Push Checklist
1. Ensure .env is not committed.
2. Initialize git, add files, and commit.
3. Add GitHub remote and push.

Example commands:
- git add .
- git commit -m "Initial commit"
- git remote add origin <your-repo-url>
- git push -u origin main
