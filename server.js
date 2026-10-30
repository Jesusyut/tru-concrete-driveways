import http from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || resolve(root, 'data/leads.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, payload TEXT NOT NULL)');
const assets = new Map(['index.html', 'style.css', 'app.js'].map(name => ['/' + (name === 'index.html' ? '' : name), { body: readFileSync(resolve(root, 'public', name)), type: name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : 'text/html' }]));
const limits = new Map();
const respond = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https://images.unsplash.com; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (req.url === '/health') return respond(res, 200, { status: 'ok' });
  if (req.url === '/api/quotes' && req.method === 'POST') {
    const ip = req.socket.remoteAddress;
    const now = Date.now();
    for (const [key, value] of limits) if (now - value.start > 600000) limits.delete(key);
    const bucket = limits.get(ip) || { start: now, count: 0 };
    if (++bucket.count > 20) return respond(res, 429, { error: 'Too many requests. Please try again in 10 minutes.' });
    limits.set(ip, bucket);
    try {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 12000) return respond(res, 413, { error: 'Request too large.' }); }
      const data = JSON.parse(raw);
      const fields = ['project', 'finish', 'size', 'timing', 'state', 'address', 'name', 'email', 'phone'];
      if (fields.some(key => typeof data[key] !== 'string' || !data[key].trim() || data[key].length > 200) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.phone.replace(/\D/g, '').length < 10 || !/^[A-Z]{2}$/.test(data.state) || data.consent !== true) return respond(res, 400, { error: 'Please complete all required fields and consent to contact.' });
      if (data.website) return respond(res, 400, { error: 'Unable to submit this request.' });
      const payload = Object.fromEntries(fields.map(key => [key, data[key].trim()]));
      payload.consent = true;
      const id = randomUUID();
      db.prepare('INSERT INTO leads VALUES (?, ?, ?)').run(id, new Date().toISOString(), JSON.stringify(payload));
      return respond(res, 201, { id });
    } catch { return respond(res, 400, { error: 'Unable to save your request. Please try again.' }); }
  }
  const asset = assets.get((req.url || '/').split('?')[0]);
  if (asset && ['GET', 'HEAD'].includes(req.method)) { res.writeHead(200, { 'Content-Type': asset.type + '; charset=utf-8' }); return res.end(req.method === 'HEAD' ? undefined : asset.body); }
  respond(res, 404, { error: 'Not found' });
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
process.on('SIGTERM', () => server.close(() => { db.close(); process.exit(0); }));
