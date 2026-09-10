#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline';

const execFileAsync = promisify(execFile);
const SERVICE = 'com.turbulentground.research.airtable';
const ACCOUNT = 'research-pattern-analyst';

if (!process.stdin.isTTY) {
  console.error('Run this command in an interactive terminal.');
  process.exit(1);
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdout.write('Paste the dedicated Airtable PAT (input is hidden), then press Return: ');

let secret = '';
process.stdin.on('keypress', async (character, key) => {
  if (key?.ctrl && key.name === 'c') {
    process.stdin.setRawMode(false);
    process.stdout.write('\nCancelled.\n');
    process.exit(130);
  }
  if (key?.name === 'return') {
    process.stdin.setRawMode(false);
    process.stdout.write('\n');
    process.stdin.pause();
    if (!secret.trim()) {
      console.error('No credential was entered. Nothing was stored.');
      process.exit(1);
    }
    try {
      await execFileAsync('/usr/bin/security', [
        'add-generic-password',
        '-U',
        '-s', SERVICE,
        '-a', ACCOUNT,
        '-w', secret.trim(),
      ]);
      secret = '';
      console.log('Stored the dedicated Airtable credential in macOS Keychain.');
      process.exit(0);
    } catch {
      secret = '';
      console.error('Keychain could not store the credential.');
      process.exit(1);
    }
  }
  if (key?.name === 'backspace' || key?.name === 'delete') {
    secret = secret.slice(0, -1);
    return;
  }
  if (character && !key?.ctrl && !key?.meta) secret += character;
});
