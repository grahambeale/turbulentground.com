import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.dirname(fileURLToPath(import.meta.url));
const change = path.join(root, 'changes/clarify-survey-journey');
const baseId = 'app7dKDinTjxczEfD', tableId = 'tbltQDAUZ8FF0ZDvA', recordId = 'recXsGlAyZTEvogkV';
const read = name => fs.readFileSync(path.join(change, name), 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function packet() {
  if (fs.existsSync(path.join(change, 'approved-question-amendment.md'))) throw new Error('The historical packet has an approved question amendment. Read and preserve the full Airtable history through the authenticated connector; do not overwrite it with the old packet.');
  const manifest = JSON.parse(read('review-packet.json'));
  for (const [name, digest] of Object.entries(manifest.files)) if (hash(read(name)) !== digest) throw new Error('Packet changed: refresh and return to Graham.');
  return `OpenSpec specification — revision ${manifest.revision}\nFeedback: FB-20260911-TEVOGK\n\nRead here; put amendments in Review notes. Design remains paused until this revision is approved.\n\n` + Object.keys(manifest.files).map(name => `--- ${name} ---\n\n${read(name)}`).join('\n\n');
}
export function payload() {
  return { baseId, tableId, records: [{ id: recordId, fields: {
    fldsClTyqQCZieQvj: packet(), fldweW0Xu2zKmUkcF: 'Pending', fldHo0OtoX08jX4lr: 'Awaiting approval',
    fldpqSAhB4Ih3xcPN: 'Read the full revised spec in Proposed solution. Amend Review notes and approve this revision when ready. Design/prototype remains paused.',
    fld7pXDuZmbJCkSbI: new Date().toISOString(), fldJnLnw8Y9OWC0y4: 'Codex'
  } }] };
}
async function request(method = 'GET', body) {
  const token = process.env.AIRTABLE_RESEARCH_TOKEN || process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('Use connected Airtable tools or supply AIRTABLE_RESEARCH_TOKEN securely. No token is stored.');
  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new Error(`Airtable ${method} failed (${response.status}); stop.`);
  return response.json();
}
async function main(command) {
  if (command === 'refresh') {
    const manifest = JSON.parse(read('review-packet.json'));
    for (const name of Object.keys(manifest.files)) manifest.files[name] = hash(read(name));
    fs.writeFileSync(path.join(change, 'review-packet.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log('Digests refreshed; publish for renewed review. No approval granted.');
  } else if (command === 'export') console.log(JSON.stringify(payload()));
  else if (command === 'publish') {
    const before = await request();
    if (before.fields['Proposed solution'] === packet()) { console.log('Aligned; decision preserved.'); return; }
    await request('PATCH', { fields: payload().records[0].fields });
    const after = await request();
    if (after.fields['Proposed solution'] !== packet() || after.fields["Graham's decision"] !== 'Pending') throw new Error('Read-back mismatch.');
    console.log('Full packet verified in Airtable; original feedback and Review notes preserved.');
  } else if (command === 'pull') {
    const record = await request();
    console.log(JSON.stringify({ recordId, decision: record.fields["Graham's decision"], reviewNotes: record.fields['Review notes'] || '', packetMatches: record.fields['Proposed solution'] === packet() }));
  } else if (command === 'check') {
    if (spawnSync('python3', [path.join(root, 'check-gate.py')], { stdio: 'inherit' }).status !== 0) throw new Error('Local approval blocked.');
    const record = await request(), approval = JSON.parse(read('approval.json'));
    if (record.fields['Proposed solution'] !== packet() || record.fields["Graham's decision"] !== 'Approved' || hash(record.fields['Review notes'] || '') !== approval.airtable_review_notes_sha256) throw new Error('Airtable decision, notes or revision changed; return to Graham.');
    console.log('Live approval matches. No release approval implied.');
  } else throw new Error('Commands: refresh | export | publish | pull | check');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
