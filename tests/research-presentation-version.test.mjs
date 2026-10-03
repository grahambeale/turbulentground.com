// presentationVersion + viewport bucket (research/openspec/changes/survey-mobile-type-scale, approved 3 Oct 2026).
// Mocked Airtable; synthetic data only. Checks: validation, start recorded ONCE and never overwritten, submit values,
// the server-side mixedPresentation flag, and that clients without the tag still work (nothing stored).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import save from '../api/research-save-progress.js';
import submit from '../api/research-submit.js';

const F = {
  vStart: 'fldDOjXS90Ao2zovS', vSubmit: 'fldg9KDdCS7PSkkC1', bStart: 'fldblUdGZUNC9rCrK', bSubmit: 'fldxS9VRq6umbVL1u', mixed: 'fldD0D5WlmcyCqVwE',
  instrument: 'fldHJ4KNzMbpzdob6',
};
const V5 = 'phase3-v5-2026-09-25-examples';
const BASE = 'baseline-2026-10';
const RESTYLE = 'phone-type-scale-2026-10';
const oldFetch = global.fetch, oldEnv = { ...process.env };
process.env.AIRTABLE_RESEARCH_TOKEN = 'synthetic';
const pairResponses = Object.fromEntries(Array.from({ length: 12 }, (_, i) => ['d' + (i + 1), { contribution: 4, conditions: 2 }]));
const response = () => ({ _status: 200, status(s) { this._status = s; return this; }, setHeader() {}, json(b) { this.body = b; return this; } });
const ok = (x) => ({ ok: true, status: 200, json: async () => x, text: async () => JSON.stringify(x) });

async function call(handler, body, existing) {
  const writes = [];
  global.fetch = async (url, options = {}) => {
    const u = String(url);
    if (!options.method || options.method === 'GET') {
      if (u.includes('tblwpricYYzx4rmiR')) return ok({ records: [{ id: 'rec_identity', fields: { fld6danERot7gjOqb: 'synthetic', fldEhm06lLDvEeF6q: 'Sent' } }] });
      if (u.includes('tblL9mf8VfAmbhuG7')) return ok({ records: existing ? [{ id: 'rec_resp', fields: { [F.instrument]: V5, ...existing } }] : [] });
    }
    if (u.includes('tblL9mf8VfAmbhuG7')) { const b = JSON.parse(options.body); writes.push({ method: options.method, fields: b.fields || b.records[0].fields }); }
    return ok({});
  };
  const res = response();
  await handler({ method: 'POST', body: { token: 'synthetic', instrumentVersion: V5, consent: { takingPart: true }, pairResponses, ...body } }, res);
  return { res, writes };
}
const tag = (version, viewportBucket) => ({ presentation: { version, viewportBucket } });

try {
  // ---- save-progress
  let r = await call(save, tag(BASE, 'phone'), null);
  assert.equal(r.res._status, 200);
  assert.equal(r.writes[0].method, 'POST');
  assert.equal(r.writes[0].fields[F.vStart], BASE);
  assert.equal(r.writes[0].fields[F.bStart], 'phone');
  assert.equal(r.writes[0].fields[F.vSubmit], undefined, 'save never writes the submit values');

  r = await call(save, tag(RESTYLE, 'desktop'), { [F.vStart]: BASE, [F.bStart]: 'phone' });
  assert.equal(r.res._status, 200);
  assert.equal(r.writes[0].method, 'PATCH');
  assert.equal(r.writes[0].fields[F.vStart], undefined, 'start values are never overwritten');
  assert.equal(r.writes[0].fields[F.bStart], undefined);

  r = await call(save, tag(BASE, 'phone'), {});   // a response created before the tag existed
  assert.equal(r.res._status, 200);
  assert.equal(r.writes[0].fields[F.vStart], undefined, 'a pre-tag response is not backfilled: its start layout is unknown');

  r = await call(save, {}, null);   // a client that predates the tag
  assert.equal(r.res._status, 200);
  for (const k of [F.vStart, F.bStart, F.vSubmit, F.bSubmit, F.mixed]) assert.equal(r.writes[0].fields[k], undefined);

  for (const bad of [{ presentation: 'x' }, { presentation: null }, { presentation: [] }, tag('made-up', 'phone'), tag(BASE, '390px'), tag(BASE, 'PHONE'), { presentation: { version: BASE } }]) {
    r = await call(save, bad, null);
    assert.equal(r.res._status, 400, JSON.stringify(bad));
    assert.equal(r.writes.length, 0, 'nothing is written for an invalid tag');
  }

  // ---- submit
  r = await call(submit, tag(RESTYLE, 'phone'), { [F.vStart]: BASE, [F.bStart]: 'phone' });
  assert.equal(r.res._status, 200, JSON.stringify(r.res.body));
  assert.equal(r.writes[0].fields[F.vSubmit], RESTYLE);
  assert.equal(r.writes[0].fields[F.bSubmit], 'phone');
  assert.equal(r.writes[0].fields[F.mixed], true, 'started under baseline, submitted under the restyle: mixed');
  assert.equal(r.writes[0].fields[F.vStart], undefined, 'submit does not rewrite the start');

  r = await call(submit, tag(BASE, 'tablet'), { [F.vStart]: BASE, [F.bStart]: 'phone' });
  assert.equal(r.writes[0].fields[F.mixed], false, 'same layout at start and submit: not mixed (a different bucket alone is not mixed)');
  assert.equal(r.writes[0].fields[F.bSubmit], 'tablet');

  r = await call(submit, tag(BASE, 'phone'), {});   // started before the tag existed
  assert.equal(r.res._status, 200);
  assert.equal(r.writes[0].fields[F.vSubmit], BASE);
  assert.equal(r.writes[0].fields[F.mixed], undefined, 'start unknown: mixed is left unset, not guessed');
  assert.equal(r.writes[0].fields[F.vStart], undefined);

  r = await call(submit, tag(RESTYLE, 'desktop'), null);   // submitted with no earlier save
  assert.equal(r.res._status, 200);
  assert.equal(r.writes[0].method, 'POST');
  assert.equal(r.writes[0].fields[F.vStart], RESTYLE);
  assert.equal(r.writes[0].fields[F.bStart], 'desktop');
  assert.equal(r.writes[0].fields[F.mixed], false);

  r = await call(submit, {}, { [F.vStart]: BASE, [F.bStart]: 'phone' });   // a client that predates the tag
  assert.equal(r.res._status, 200);
  for (const k of [F.vSubmit, F.bSubmit, F.mixed]) assert.equal(r.writes[0].fields[k], undefined);

  for (const bad of [{ presentation: 5 }, tag('made-up', 'phone'), tag(BASE, 'wide')]) {
    r = await call(submit, bad, null);
    assert.equal(r.res._status, 400, JSON.stringify(bad));
    assert.equal(r.writes.length, 0);
  }
  // ---- static checks: the page declares the version in CSS and sends it; the notices carry the row and the date
const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const page = read('research/index.html');
const declared = (page.match(/:root\s*\{\s*--presentation-version:\s*([a-z0-9-]+)\s*;/) || [])[1];
assert.ok([BASE, RESTYLE].includes(declared), `research/index.html declares --presentation-version: ${declared}`);
assert.equal((page.match(/presentation: presentationInfo\(\)/g) || []).length, 2, 'both the save payload and the submit payload carry the tag');
assert.match(page, /getPropertyValue\('--presentation-version'\)/);
assert.match(page, /w < 640 \? 'phone' : \(w < 1024 \? 'tablet' : 'desktop'\)/, 'bucket thresholds: phone <640, tablet 640-1023, desktop >=1024');
for (const f of ['privacy.html', 'research/privacy.html']) {
  const t = read(f);
  assert.match(t, /kind of screen you used/i, `${f}: privacy notice row for the viewport bucket and layout version`);
  assert.match(t, /layout version/i);
  assert.match(t, /Last updated:<\/strong> 3 October 2026/, `${f}: last updated date`);
}
console.log('research-presentation-version: ok');
} finally {
  global.fetch = oldFetch;
  process.env = oldEnv;
}
