import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('quote API validates requests and persists leads without exposing them', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'foundation-test-'));
  const path = join(directory, 'test.sqlite');
  const child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: '3187', DATABASE_PATH: path }, stdio: 'ignore' });
  const base = 'http://127.0.0.1:3187';
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) { try { ready = (await fetch(base + '/health')).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 50)); }
    assert.ok(ready, 'server starts');
    const homepage = await fetch(base);
    assert.equal(homepage.status, 200);
    assert.match(await homepage.text(), /A great home starts/);
    const submit = data => fetch(base + '/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    assert.equal((await submit({})).status, 400);
    const lead = { project: 'New driveway installation', finish: 'Standard broom finish', address: '123 Test Street', size: '2-car driveway', timing: 'Within 1–3 months', state: 'TX', name: 'Test Person', email: 'test@example.com', phone: '5551234567', consent: true };
    assert.equal((await submit({ ...lead, consent: false })).status, 400);
    assert.equal((await submit({ ...lead, email: 'invalid' })).status, 400);
    assert.equal((await submit({ ...lead, website: 'bot' })).status, 400);
    const response = await submit(lead);
    assert.equal(response.status, 201);
    const { id } = await response.json();
    const db = new DatabaseSync(path);
    const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    assert.equal(JSON.parse(row.payload).address, lead.address);
    db.close();
    assert.equal((await fetch(base + '/data/leads.sqlite')).status, 404);
    assert.equal((await fetch(base + '/server.js')).status, 404);
  } finally { child.kill('SIGTERM'); await new Promise(resolve => child.once('exit', resolve)); rmSync(directory, { recursive: true, force: true }); }
});
