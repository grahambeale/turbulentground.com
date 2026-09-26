#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "research/versions/phase-3-1-schema-v1.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const args = new Set(process.argv.slice(2));

function fieldOptions(field, tableIds = {}) {
  if (field.type === "singleSelect") {
    return { choices: field.choices.map((name) => ({ name })) };
  }
  if (field.type === "dateTime") {
    return {
      dateFormat: { name: "iso" },
      timeFormat: { name: "24hour" },
      timeZone: "utc"
    };
  }
  if (field.type === "number") return { precision: 0 };
  if (field.type === "multipleRecordLinks") {
    const linkedTableId = tableIds[field.linkedTable];
    if (!linkedTableId) throw new Error(`Linked table is unavailable: ${field.linkedTable}`);
    // Airtable's schema API does not accept prefersSingleRecordLink when a
    // linked-record field is created. Cardinality is enforced by the app.
    return { linkedTableId };
  }
  return undefined;
}

function apiField(field, tableIds) {
  const result = { name: field.name, type: field.type };
  const options = fieldOptions(field, tableIds);
  if (options) result.options = options;
  return result;
}

function printPlan() {
  const output = {
    baseId: manifest.baseId,
    mode: "plan-only",
    existingTables: manifest.existingTables.map((table) => ({
      name: table.name,
      id: table.id,
      addFields: table.addFields.map((field) => field.name)
    })),
    newTables: manifest.newTables.map((table) => ({
      name: table.name,
      fields: table.fields.map((field) => field.name)
    })),
    featureFlags: manifest.featureFlags
  };
  console.log(JSON.stringify(output, null, 2));
}

async function loadLocalToken() {
  if (process.env.AIRTABLE_RESEARCH_TOKEN) return process.env.AIRTABLE_RESEARCH_TOKEN;
  try {
    const text = await readFile(path.join(root, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^AIRTABLE_RESEARCH_TOKEN=(.+)$/);
      if (match) return match[1].trim();
    }
  } catch {}
  return "";
}

async function airtable(token, pathname, init = {}) {
  const response = await fetch(`https://api.airtable.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    const type = body?.error?.type || `HTTP_${response.status}`;
    throw new Error(`${type}: Airtable schema request failed`);
  }
  return body;
}

async function readSchema(token) {
  return airtable(token, `/v0/meta/bases/${manifest.baseId}/tables`);
}

function auditSchema(schema) {
  const byName = Object.fromEntries(schema.tables.map((table) => [table.name, table]));
  const operations = [];
  for (const table of manifest.existingTables) {
    const live = schema.tables.find((item) => item.id === table.id);
    if (!live) throw new Error(`Required existing table is missing: ${table.name}`);
    for (const [name, id] of Object.entries(table.verifiedExistingFields)) {
      if (!live.fields.some((field) => field.id === id)) {
        throw new Error(`Required existing field is missing: ${table.name}.${name}`);
      }
    }
    for (const field of table.addFields) {
      if (!live.fields.some((item) => item.name === field.name)) {
        operations.push({ action: "add-field", table: table.name, field: field.name });
      }
    }
  }
  for (const table of manifest.newTables) {
    const live = byName[table.name];
    if (!live) {
      operations.push({ action: "create-table", table: table.name });
      continue;
    }
    for (const field of table.fields) {
      if (!live.fields.some((item) => item.name === field.name)) {
        operations.push({ action: "add-field", table: table.name, field: field.name });
      }
    }
  }
  return operations;
}

async function createMissing(token, initialSchema) {
  let schema = initialSchema;
  let byName = Object.fromEntries(schema.tables.map((table) => [table.name, table]));

  for (const table of manifest.newTables) {
    if (byName[table.name]) continue;
    const primary = table.fields.find((field) => field.primary);
    await airtable(token, `/v0/meta/bases/${manifest.baseId}/tables`, {
      method: "POST",
      body: JSON.stringify({ name: table.name, fields: [apiField(primary, {})] })
    });
  }

  schema = await readSchema(token);
  byName = Object.fromEntries(schema.tables.map((table) => [table.name, table]));
  const tableIds = Object.fromEntries(schema.tables.map((table) => [table.name, table.id]));

  for (const table of [...manifest.existingTables, ...manifest.newTables]) {
    const live = table.id
      ? schema.tables.find((item) => item.id === table.id)
      : byName[table.name];
    const desiredFields = table.addFields || table.fields.filter((field) => !field.primary);
    for (const field of desiredFields) {
      if (live.fields.some((item) => item.name === field.name)) continue;
      await airtable(token, `/v0/meta/bases/${manifest.baseId}/tables/${live.id}/fields`, {
        method: "POST",
        body: JSON.stringify(apiField(field, tableIds))
      });
    }
  }
  return readSchema(token);
}

if (args.has("--print-plan")) {
  printPlan();
  process.exit(0);
}

const token = await loadLocalToken();
if (!token) {
  console.error("AIRTABLE_RESEARCH_TOKEN is required for schema check/apply.");
  process.exit(1);
}

try {
  const before = await readSchema(token);
  const planned = auditSchema(before);
  if (!args.has("--apply")) {
    console.log(JSON.stringify({ mode: "check", operations: planned }, null, 2));
    process.exit(0);
  }
  if (process.env.PHASE31_SCHEMA_CONFIRM !== manifest.baseId) {
    throw new Error(`Refusing apply: set PHASE31_SCHEMA_CONFIRM=${manifest.baseId}`);
  }
  const after = await createMissing(token, before);
  const remaining = auditSchema(after);
  console.log(JSON.stringify({
    mode: "apply",
    remainingOperations: remaining,
    tables: after.tables
      .filter((table) => manifest.newTables.some((item) => item.name === table.name))
      .map((table) => ({ id: table.id, name: table.name, fields: table.fields.map((field) => ({ id: field.id, name: field.name, type: field.type })) }))
  }, null, 2));
  if (remaining.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
