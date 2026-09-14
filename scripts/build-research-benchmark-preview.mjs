import { mkdirSync, writeFileSync } from 'node:fs';
import { computeStatementBenchmark } from '../api/_research-benchmarks.js';
import { buildEmailHtml } from '../api/research-results-email.js';

const version='phase3-v4-2026-09-13-paired';
const pairs=Object.fromEntries(Array.from({length:12},(_,i)=>['d'+(i+1),{contribution:4,conditions:3}]));
const records=n=>Array.from({length:n},(_,i)=>({fields:{flduL4PmBEfH9rLpz:`synthetic-${i}`,fldHJ4KNzMbpzdob6:version,fld8sYjswX21vvVXz:'2026-09-14',fldc1EMbDAHAO99Av:true,fldvxb2mrIYVKLGVM:JSON.stringify(pairs)}}));
mkdirSync('research/benchmark-preview',{recursive:true});
const emails={};
for(const state of ['building','available','partial']) {
  const rows=records(state==='building'?14:15);
  if(state==='partial')rows[14].fields.fldvxb2mrIYVKLGVM=JSON.stringify({d1:{conditions:3}});
  const benchmark=computeStatementBenchmark(rows,version,'2026-09-14T12:00:00Z');
  emails[state]=buildEmailHtml('',pairs,benchmark,'synthetic-preview',version).replace(/[ \t]+$/gm,'');
  writeFileSync(`research/benchmark-preview/${state}.html`,emails[state]);
}
writeFileSync('research/benchmark-preview.html',`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Benchmark review preview</title><style>
*{box-sizing:border-box}body{margin:0;background:#100e0b;color:#e8dcc8;font:16px/1.6 Arial,sans-serif}header{max-width:900px;margin:auto;padding:24px}h1{font:32px/1.2 Georgia,serif}button{font:inherit;padding:10px 16px;border:1px solid #988365;border-radius:24px;background:#201b15;color:#e8dcc8;cursor:pointer;margin:6px 8px 6px 0}button[aria-pressed=true]{background:#ef7b45;color:#100e0b;border-color:#ef7b45}button:focus-visible{outline:3px solid white;outline-offset:3px}iframe{width:100%;height:78vh;border:0;background:#100e0b}small{color:#c7b69c}</style></head>
<body><header><small>SYNTHETIC DEMONSTRATION · NO PARTICIPANT DATA OR EMAIL SENDING</small><h1>Your study comparison</h1><p>Review how the results email explains unavailable and available comparisons. Earlier question versions remain separate following the context audit.</p><div role="group" aria-label="Comparison scenario"><button data-state="building" aria-pressed="true">14 answers · still building</button><button data-state="available" aria-pressed="false">15 answers · available</button><button data-state="partial" aria-pressed="false">Mixed availability</button></div><p id="description" aria-live="polite">Each statement has 14 eligible synthetic answers, below the existing minimum.</p></header><iframe title="Synthetic research results email" srcdoc=""></iframe><script>
const emails=${JSON.stringify(emails).replace(/</g,'\\u003c')};
document.querySelector('iframe').srcdoc=emails.building;
const descriptions={building:'Each statement has 14 eligible synthetic answers, below the existing minimum.',available:'Each statement has 15 eligible synthetic answers. Its comparison shows the count and question version.',partial:'One statement has 15 eligible synthetic answers; the remaining statements have 14. Only the eligible comparison appears.'};
document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.getElementById('description').textContent=descriptions[b.dataset.state];document.querySelector('iframe').srcdoc=emails[b.dataset.state];}));
</script></body></html>`);
console.log('Synthetic preview built using the real results renderer and statement calculation');
