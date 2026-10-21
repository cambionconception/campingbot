// Cloudflare Worker: stores watches in KV, checks Recreation.gov on a cron, texts via Twilio.
const CORS = {
  "Access-Control-Allow-Origin": "*", // tighten to your GitHub Pages origin, e.g. https://you.github.io
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", ...CORS } });
const DAY = 86400000;

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return json({ error: "Not found" }, 404);
    let b; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

    const m = /recreation\.gov\/camping\/campgrounds\/(\d+)/.exec(b.url || "");
    if (!m) return json({ error: "That doesn't look like a Recreation.gov campground link." }, 400);
    const digits = String(b.phone || "").replace(/\D/g, "");
    const phone = digits.length === 10 ? "+1" + digits : digits.length === 11 && digits[0] === "1" ? "+" + digits : null;
    if (!phone) return json({ error: "Enter a 10-digit US mobile number." }, 400);
    const ok = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
    if (!ok(b.start) || !ok(b.end) || b.end <= b.start) return json({ error: "Check your dates." }, 400);
    if ((Date.parse(b.end) - Date.parse(b.start)) / DAY > 14) return json({ error: "Stays are limited to 14 nights." }, 400);

    const existing = await env.WATCHES.list({ prefix: `w:${phone}:` });
    if (existing.keys.length >= 3) return json({ error: "Limit of 3 active watches per number." }, 429);

    const w = { id: m[1], phone, start: b.start, end: b.end, url: `https://www.recreation.gov/camping/campgrounds/${m[1]}` };
    await env.WATCHES.put(`w:${phone}:${w.id}:${w.start}:${w.end}`, JSON.stringify(w),
      { expirationTtl: Math.max(3600, Math.floor((Date.parse(b.end) - Date.now()) / 1000)) });
    return json({ message: "You're set. We'll text you when a site opens for those dates." });
  },

  async scheduled(_evt, env) {
    const { keys } = await env.WATCHES.list({ prefix: "w:" });
    const cache = {};
    for (const { name } of keys) {
      const w = JSON.parse(await env.WATCHES.get(name) || "null");
      if (!w) continue;
      try {
        const sites = await findSites(w, cache);
        if (!sites.length) continue;
        await sms(env, w.phone, `Campsite open! ${sites.length} site(s) free ${w.start} to ${w.end}. Book fast: ${w.url}`);
        await env.WATCHES.delete(name); // one alert per watch; re-submit to watch again
      } catch (e) { console.log("check failed", name, e.message); }
    }
  },
};

async function monthData(id, y, mo, cache) {
  const key = `${id}:${y}-${mo}`;
  if (cache[key]) return cache[key];
  const start = `${y}-${String(mo).padStart(2, "0")}-01T00%3A00%3A00.000Z`;
  const r = await fetch(`https://www.recreation.gov/api/camps/availability/campground/${id}/month?start_date=${start}`,
    { headers: { "User-Agent": "Mozilla/5.0 (campwatch)", Accept: "application/json" } });
  if (!r.ok) throw new Error(`rec.gov ${r.status}`);
  return (cache[key] = (await r.json()).campsites || {});
}

// Returns site IDs available for every night from start (inclusive) to end (exclusive).
async function findSites(w, cache) {
  const nights = [];
  for (let t = Date.parse(w.start); t < Date.parse(w.end); t += DAY) nights.push(new Date(t));
  const months = [...new Set(nights.map(d => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`))];
  const merged = {};
  for (const ym of months) {
    const [y, mo] = ym.split("-").map(Number);
    const data = await monthData(w.id, y, mo, cache);
    for (const [sid, s] of Object.entries(data)) Object.assign(merged[sid] ??= {}, s.availabilities);
  }
  return Object.keys(merged).filter(sid =>
    nights.every(d => merged[sid][d.toISOString().slice(0, 10) + "T00:00:00Z"] === "Available"));
}

async function sms(env, to, body) {
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: env.TWILIO_FROM, Body: body }),
  });
  if (!r.ok) throw new Error("twilio " + r.status);
}
