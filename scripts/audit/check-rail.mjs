// Fails the build if the homepage section rail (clickable dots with labels and
// tooltips) is overwritten or damaged. Added after ddb8f67 silently replaced it
// with the older dot-only rail. The links are built in JavaScript from
// RAIL_LABELS, so this checks the markup, the scenes, the labels and the code
// that turns them into labelled links and tooltips.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const problems = [];
const need = (ok, msg) => { if (!ok) problems.push(msg); };

need(/<nav\b[^>]*\bid="rail-nav"[^>]*\baria-label="[^"]+"/.test(html) || /<nav\b[^>]*\baria-label="[^"]+"[^>]*\bid="rail-nav"/.test(html),
  'nav#rail-nav with an aria-label is missing');
need(/<nav\b[^>]*\bid="rail-nav"[^>]*>\s*<ol\b[^>]*\bid="rail"/.test(html), 'nav#rail-nav must contain ol#rail');

const scenes = [...html.matchAll(/\bdata-scene="([a-z]+)"/g)].map((m) => m[1]);
const unique = [...new Set(scenes)];
need(unique.length === 5, `expected 5 data-scene sections, found ${unique.length} (${unique.join(', ')})`);

const labelsSrc = /var RAIL_LABELS\s*=\s*\{([^}]*)\}/.exec(html);
need(!!labelsSrc, 'RAIL_LABELS is missing');
if (labelsSrc) {
  const labels = Object.fromEntries([...labelsSrc[1].matchAll(/(\w+)\s*:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));
  for (const s of unique) need(labels[s] && labels[s].trim().length > 0, `no rail label for scene "${s}"`);
}

need(/createElement\('a'\)/.test(html) && /setAttribute\('aria-label',\s*'Go to: '/.test(html),
  'rail links must be <a> elements with an aria-label');
need(/class="tip"/.test(html), 'rail links must contain a .tip tooltip');
need(/\.rail \.tip\s*\{/.test(html) && /\.rail a:hover \.tip,\s*\.rail a:focus-visible \.tip\s*\{[^}]*opacity:\s*1/.test(html),
  'tooltip CSS (.rail .tip and the hover/focus-visible reveal) is missing');
need(/\.rail-nav\.away\s*\{/.test(html) && /railNav\.classList\.toggle\('away'/.test(html), 'rail hide-at-footer behaviour is missing');

if (problems.length) {
  console.error('[rail] FAILED: the homepage section rail is missing or damaged:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`[rail] ok: nav#rail-nav with ${unique.length} labelled scenes, links, tooltips and hide-at-footer`);
