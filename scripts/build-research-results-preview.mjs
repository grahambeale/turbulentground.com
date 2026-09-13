import fs from 'node:fs';
import {buildEmailHtml} from '../api/research-results-email.js';
import {INSTRUMENTS,LEGACY_VERSION,PAIRED_VERSION} from '../api/_research-instruments.js';
const pairs=Object.fromEntries(INSTRUMENTS[PAIRED_VERSION].map(d=>[d.key,{contribution:4,conditions:2}]));
pairs.d5.contribution='not_applicable';pairs.d8.conditions='skip';
const benchmark={cohortSize:15,domains:Object.fromEntries(Object.keys(pairs).map(k=>[k,{contribution:{mean:3.2,n:15},conditions:{mean:3.1,n:15}}]))};
for(const [file,version,b] of [['results-preview-v4.html',PAIRED_VERSION,benchmark],['results-preview-v4-own.html',PAIRED_VERSION,{cohortSize:0,domains:null}],['results-preview-v3.html',LEGACY_VERSION,benchmark]]){
const note='<aside style="padding:20px;background:#3a241a;color:#e8dcc8;font:14px/1.6 Arial,sans-serif;">Review preview: fictional answers and benchmarks only. No email is sent and no participant record is accessed.<br><a style="color:#ef7b45" href="results-preview-v4.html">Revised questions with benchmark</a> · <a style="color:#ef7b45" href="results-preview-v4-own.html">Revised questions, own answers only</a> · <a style="color:#ef7b45" href="results-preview-v3.html">Historical questions</a></aside>';
const html=buildEmailHtml('Fictional reviewer',pairs,b,'preview-only',version).replace(/<body[^>]*>/,'$&'+note).replace(/<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">This requested comparison[\s\S]*?<\/p>/,'');
fs.writeFileSync(new URL('../research/'+file,import.meta.url),html.split('\n').map(line => line.trimEnd()).join('\n'));
}
