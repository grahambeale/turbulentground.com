#!/usr/bin/env node
// Scoped Airtable MCP shim for the research-pattern-analyst subagent.
//
// This server runs only on Graham's trusted Mac. It reads a dedicated
// Airtable PAT from macOS Keychain and enforces its table allowlists before
// retrieving that credential or making any network request. It must not be
// moved to an unauthenticated HTTP endpoint.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const AIRTABLE_API = 'https://api.airtable.com/v0';
const AIRTABLE_BASE_ID = 'app7dKDinTjxczEfD';
const RESPONSES_TABLE_ID = 'tblL9mf8VfAmbhuG7';
const FINDINGS_TABLE_ID = 'tblfhjFPVg4qx8QSh';
const KEYCHAIN_SERVICE = 'com.turbulentground.research.airtable';
const KEYCHAIN_ACCOUNT = 'research-pattern-analyst';

const LIST_ALLOWED = new Set([RESPONSES_TABLE_ID, FINDINGS_TABLE_ID]);
const CREATE_ALLOWED = new Set([FINDINGS_TABLE_ID]);

export async function readTokenFromKeychain() {
  try {
    const { stdout } = await execFileAsync('/usr/bin/security', [
      'find-generic-password',
      '-s', KEYCHAIN_SERVICE,
      '-a', KEYCHAIN_ACCOUNT,
      '-w',
    ]);
    const token = stdout.trim();
    if (!token) throw new Error('The Keychain item is empty.');
    return token;
  } catch {
    throw new Error(
      `Airtable credential unavailable. Add a password item in macOS Keychain with service "${KEYCHAIN_SERVICE}" and account "${KEYCHAIN_ACCOUNT}".`,
    );
  }
}

function validateBase(baseId) {
  if (baseId !== AIRTABLE_BASE_ID) {
    throw new Error(`Rejected: baseId "${baseId}" is not the TurbulentGround Research base.`);
  }
}

function validateList(args) {
  validateBase(args?.baseId);
  if (!LIST_ALLOWED.has(args?.tableId)) {
    throw new Error(`Rejected: tableId "${args?.tableId}" is not in the list allowlist (Responses, Findings only).`);
  }
}

function validateCreate(args) {
  validateBase(args?.baseId);
  if (!CREATE_ALLOWED.has(args?.tableId)) {
    throw new Error(`Rejected: tableId "${args?.tableId}" is not in the create allowlist (Findings only).`);
  }
  if (!Array.isArray(args.records) || args.records.length === 0) {
    throw new Error('records must be a non-empty array of { fields } objects.');
  }
}

async function airtableFetch(token, pathName, options, fetchImpl) {
  return fetchImpl(`${AIRTABLE_API}/${pathName}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
}

export async function listRecordsForTable(args, dependencies = {}) {
  validateList(args);
  const tokenProvider = dependencies.tokenProvider || readTokenFromKeychain;
  const fetchImpl = dependencies.fetchImpl || fetch;
  const token = await tokenProvider();
  const params = new URLSearchParams();
  if (args.pageSize) params.set('pageSize', String(Math.min(Number(args.pageSize) || 100, 100)));
  if (Array.isArray(args.fieldIds)) {
    for (const field of args.fieldIds) params.append('fields[]', field);
  }

  const records = [];
  let offset;
  do {
    if (offset) params.set('offset', offset);
    else params.delete('offset');
    const suffix = params.toString() ? `?${params}` : '';
    const response = await airtableFetch(
      token,
      `${AIRTABLE_BASE_ID}/${args.tableId}${suffix}`,
      { method: 'GET' },
      fetchImpl,
    );
    if (!response.ok) throw new Error(`Airtable list request failed with status ${response.status}.`);
    const body = await response.json();
    records.push(...(body.records || []));
    offset = body.offset;
  } while (offset);

  return { records };
}

export async function createRecordsForTable(args, dependencies = {}) {
  validateCreate(args);
  const tokenProvider = dependencies.tokenProvider || readTokenFromKeychain;
  const fetchImpl = dependencies.fetchImpl || fetch;
  const token = await tokenProvider();
  const created = [];
  for (let index = 0; index < args.records.length; index += 10) {
    const chunk = args.records.slice(index, index + 10);
    const response = await airtableFetch(
      token,
      `${AIRTABLE_BASE_ID}/${args.tableId}`,
      { method: 'POST', body: JSON.stringify({ records: chunk }) },
      fetchImpl,
    );
    if (!response.ok) throw new Error(`Airtable create request failed with status ${response.status}.`);
    const body = await response.json();
    created.push(...(body.records || []));
  }
  return { records: created };
}

const TOOLS = [
  {
    name: 'list_records_for_table',
    description: 'List records from the Responses or Findings table only. Any other tableId is rejected.',
    inputSchema: {
      type: 'object',
      properties: {
        baseId: { type: 'string' },
        tableId: { type: 'string' },
        fieldIds: { type: 'array', items: { type: 'string' } },
        pageSize: { type: 'number' },
      },
      required: ['baseId', 'tableId'],
    },
  },
  {
    name: 'create_records_for_table',
    description: 'Create records in the Findings table only. Any other tableId is rejected.',
    inputSchema: {
      type: 'object',
      properties: {
        baseId: { type: 'string' },
        tableId: { type: 'string' },
        records: { type: 'array', items: { type: 'object' } },
      },
      required: ['baseId', 'tableId', 'records'],
    },
  },
];

export async function callTool(name, args, dependencies) {
  if (name === 'list_records_for_table') return listRecordsForTable(args, dependencies);
  if (name === 'create_records_for_table') return createRecordsForTable(args, dependencies);
  throw new Error(`Unknown tool: ${name}`);
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function respond(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function respondError(id, message) {
  send({ jsonrpc: '2.0', id, error: { code: -32000, message } });
}

function startServer() {
  let buffer = '';
  process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      handleLine(line);
    }
  });
}

async function handleLine(line) {
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return; // ignore malformed lines
  }
  const { id, method, params } = req;
  try {
    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'scoped-airtable', version: '2.0.0' },
      });
    } else if (method === 'notifications/initialized') {
      // no response needed for notifications
    } else if (method === 'tools/list') {
      respond(id, { tools: TOOLS });
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      try {
        const result = await callTool(name, args);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false });
      } catch (err) {
        // Report rejections as a tool result (isError), not a transport
        // error, so the calling agent sees the reason clearly.
        respond(id, { content: [{ type: 'text', text: err.message }], isError: true });
      }
    } else if (id !== undefined) {
      respondError(id, `Unknown method: ${method}`);
    }
  } catch (err) {
    if (id !== undefined) respondError(id, err.message);
  }
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === entryPath) startServer();
