import assert from 'node:assert/strict';
import {
  createRecordsForTable,
  listRecordsForTable,
} from '../.claude/mcp-servers/scoped-airtable.mjs';

const BASE_ID = 'app7dKDinTjxczEfD';
const RESPONSES_ID = 'tblL9mf8VfAmbhuG7';
const FINDINGS_ID = 'tblfhjFPVg4qx8QSh';
const IDENTITY_ID = 'tblwpricYYzx4rmiR';

function forbiddenDependencies(message) {
  return {
    tokenProvider: async () => {
      throw new Error(`${message}: credential requested`);
    },
    fetchImpl: async () => {
      throw new Error(`${message}: Airtable requested`);
    },
  };
}

for (const operation of [listRecordsForTable, createRecordsForTable]) {
  await assert.rejects(
    operation({
      baseId: BASE_ID,
      tableId: IDENTITY_ID,
      records: [{ fields: { unsafe: true } }],
    }, forbiddenDependencies('Identity boundary failed')),
    /not in the .* allowlist/,
  );
}

await assert.rejects(
  createRecordsForTable({
    baseId: BASE_ID,
    tableId: RESPONSES_ID,
    records: [{ fields: { unsafe: true } }],
  }, forbiddenDependencies('Responses write boundary failed')),
  /not in the create allowlist/,
);

let listRequest;
const listResult = await listRecordsForTable({
  baseId: BASE_ID,
  tableId: RESPONSES_ID,
  fieldIds: ['Pair Responses'],
  pageSize: 25,
}, {
  tokenProvider: async () => 'test-token',
  fetchImpl: async (url, options) => {
    listRequest = { url: String(url), options };
    return { ok: true, status: 200, json: async () => ({ records: [] }) };
  },
});
assert.deepEqual(listResult, { records: [] });
assert.equal(listRequest.options.method, 'GET');
const listUrl = new URL(listRequest.url);
assert.equal(listUrl.searchParams.get('pageSize'), '25');
assert.deepEqual(listUrl.searchParams.getAll('fields[]'), ['Pair Responses']);

let createRequest;
const createResult = await createRecordsForTable({
  baseId: BASE_ID,
  tableId: FINDINGS_ID,
  records: [{ fields: { 'Re-identification Safe': true } }],
}, {
  tokenProvider: async () => 'test-token',
  fetchImpl: async (url, options) => {
    createRequest = { url: String(url), options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ records: [{ id: 'recFinding' }] }),
    };
  },
});
assert.deepEqual(createResult, { records: [{ id: 'recFinding' }] });
assert.match(createRequest.url, new RegExp(`${BASE_ID}/${FINDINGS_ID}$`));
const forwarded = JSON.parse(createRequest.options.body);
assert.equal(forwarded.records[0].fields['Re-identification Safe'], true);
assert.equal(typeof forwarded.records[0].fields['Re-identification Safe'], 'boolean');

console.log('research scoped Airtable MCP tests passed');
