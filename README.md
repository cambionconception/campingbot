# Campwatch setup

1. **Twilio**: create an account, buy a number, note Account SID, Auth Token, and the number.
   (US texting to real users requires A2P 10DLC registration; a trial account only texts verified numbers.)
2. **Backend** (free Cloudflare account), from this folder:
   ```
   npx wrangler kv namespace create WATCHES      # paste the id into wrangler.toml
   npx wrangler secret put TWILIO_SID
   npx wrangler secret put TWILIO_TOKEN
   npx wrangler secret put TWILIO_FROM           # e.g. +14085550123
   npx wrangler deploy                           # prints https://campwatch.<you>.workers.dev
   ```
3. Edit `API_URL` in `index.html` to `<that url>/watch`.
4. **Frontend**: push `index.html` to a GitHub repo, Settings > Pages > deploy from branch.
5. Optional: in `worker.js`, set `Access-Control-Allow-Origin` to your Pages origin.
